import { ReactNode, useEffect, useState, useRef } from 'react';

/**
 * COMPONENTES DE ANIMACIÓN PARA TRANSICIONES DE PANTALLA
 *
 * Este archivo contiene componentes para animaciones de transición entre pantallas
 * en la aplicación CONSTRUSMART ERP.
 *
 * Componentes principales:
 * - PageTransition: Animación de entrada para cambios de pantalla
 * - Soporta tipos: fade, slide, scale, none
 * - Respeta prefers-reduced-motion y la configuración de animaciones del usuario
 */

/**
 * PageTransition — Animación de entrada para cambios de pantalla
 * Respeta prefers-reduced-motion y la configuración de animaciones del usuario
 */
export function PageTransition({
  children,
  animationType = 'fade',
}: {
  children: ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'none';
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getAnimationClass = () => {
    if (animationType === 'none') return '';
    switch (animationType) {
      case 'slide':
        return visible ? 'animate-slide-in-right' : 'opacity-0';
      case 'scale':
        return visible ? 'animate-scale-in' : 'opacity-0';
      case 'fade':
      default:
        return visible ? 'animate-fade-in-up' : 'opacity-0';
    }
  };

  useEffect(() => {
    // Check if animations are disabled via app settings
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setVisible(true), 10);
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [children, animationType]);

  return (
    <div
      ref={ref}
      className={getAnimationClass()}
      style={{
        animationDuration: '350ms',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}