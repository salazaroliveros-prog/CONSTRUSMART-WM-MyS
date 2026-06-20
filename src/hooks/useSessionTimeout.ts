import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UseSessionTimeoutOptions {
  /** Tiempo de inactividad en milisegundos antes de cerrar sesión (default: 30 min) */
  timeout?: number;
  /** Mostrar alerta de advertencia antes de cerrar sesión */
  showWarning?: boolean;
  /** Tiempo en ms antes del timeout para mostrar advertencia (default: 60s) */
  warningLeadTime?: number;
  /** Callback cuando la sesión expira */
  onSessionExpired?: () => void;
  /** Callback cuando se muestra la advertencia */
  onWarning?: () => void;
}

/**
 * useSessionTimeout - Hook que monitorea la inactividad del usuario
 * y cierra la sesión automáticamente después de un período de inactividad.
 * 
 * Medidas de seguridad:
 * - Previene sesiones abiertas en equipos compartidos
 * - Reduce riesgo de sesiones secuestradas
 * - Cumple con OWASP Session Management
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): {
  resetTimer: () => void;
  isWarning: boolean;
} {
  const {
    timeout = 30 * 60 * 1000, // 30 minutos por defecto
    showWarning = true,
    warningLeadTime = 60 * 1000, // 1 minuto antes
    onSessionExpired,
    onWarning,
  } = options;

  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarningRef = useRef(false);
  const expiredRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    isWarningRef.current = false;
  }, []);

  const handleSessionExpired = useCallback(async () => {
    if (expiredRef.current) return;
    expiredRef.current = true;

    // Registrar cierre por inactividad
    try {
      await supabase.from('logs_sistema').insert({
        accion: 'sesion_expirada_inactividad',
        entidad: 'auth',
        entidad_id: (await supabase.auth.getUser()).data.user?.id,
        usuario_id: (await supabase.auth.getUser()).data.user?.id,
        detalles: { motivo: 'inactividad', timestamp: new Date().toISOString() },
      });
    } catch {
      // Silencioso - el cierre de sesión es prioritario
    }

    await supabase.auth.signOut();
    
    if (onSessionExpired) {
      onSessionExpired();
    }
    
    navigate('/login', { replace: true });
  }, [navigate, onSessionExpired]);

  const showWarningAlert = useCallback(() => {
    if (isWarningRef.current) return;
    isWarningRef.current = true;

    if (onWarning) {
      onWarning();
    }

    // Advertencia visual en la UI
    const warningEvent = new CustomEvent('session:warning', {
      detail: { remaining: warningLeadTime },
    });
    window.dispatchEvent(warningEvent);
  }, [warningLeadTime, onWarning]);

  const resetTimer = useCallback(() => {
    clearTimers();
    expiredRef.current = false;

    if (showWarning && warningLeadTime > 0) {
      warningTimerRef.current = setTimeout(showWarningAlert, timeout - warningLeadTime);
    }

    timerRef.current = setTimeout(handleSessionExpired, timeout);
  }, [timeout, showWarning, warningLeadTime, clearTimers, showWarningAlert, handleSessionExpired]);

  useEffect(() => {
    // Iniciar timer al montar
    resetTimer();

    // Eventos que indican actividad del usuario
    const activityEvents = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'mousemove',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Agregar event listeners con debounce para mousemove
    let moveTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleMouseMove = () => {
      if (moveTimeout) return;
      moveTimeout = setTimeout(() => {
        resetTimer();
        moveTimeout = null;
      }, 1000); // Debounce de 1s para mousemove
    };

    activityEvents.forEach((event) => {
      if (event === 'mousemove') {
        window.addEventListener(event, handleMouseMove);
      } else {
        window.addEventListener(event, handleActivity);
      }
    });

    // Escuchar evento personalizado de warning
    const handleWarning = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Podríamos mostrar un toast aquí
      console.warn(`[Session] Tu sesión expirará en ${Math.round((detail?.remaining || 0) / 1000)} segundos por inactividad`);
    };
    window.addEventListener('session:warning', handleWarning);

    return () => {
      clearTimers();
      activityEvents.forEach((event) => {
        if (event === 'mousemove') {
          window.removeEventListener(event, handleMouseMove);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      });
      window.removeEventListener('session:warning', handleWarning);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, [resetTimer, clearTimers]);

  return {
    resetTimer,
    isWarning: isWarningRef.current,
  };
}

export default useSessionTimeout;