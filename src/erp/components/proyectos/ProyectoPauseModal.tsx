import React from 'react';
import { X, Pause } from 'lucide-react';
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE } from '../../ui';

interface ProyectoPauseModalProps {
  pauseModal: { proyectoId: string; nombre: string } | null;
  pauseReason: string;
  setPauseReason: (v: string) => void;
  pauseAutorizador: string;
  setPauseAutorizador: (v: string) => void;
  pauseReanudacion: string;
  setPauseReanudacion: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string, options?: any) => string;
}

const ProyectoPauseModal: React.FC<ProyectoPauseModalProps> = ({ pauseModal, pauseReason, setPauseReason, pauseAutorizador, setPauseAutorizador, pauseReanudacion, setPauseReanudacion, onConfirm, onClose, t }) => {
  if (!pauseModal) return null;

  const resetAll = () => {
    setPauseReason('');
    setPauseAutorizador('');
    setPauseReanudacion('');
    onClose();
  };

  return (
    <div className={MODAL_OVERLAY + ' animate-enter'} role="dialog" aria-modal="true" aria-labelledby="modal-pausa-title">
      <div onClick={e => e.stopPropagation()} className={`${MODAL_PANEL.replace('max-w-lg sm:max-w-xl md:max-w-2xl', 'max-w-md')} animate-enter`}>
        <div className={MODAL_HEADER}>
          <h2 id="modal-pausa-title" className={MODAL_TITLE}>{t('proyectos.pausar_proyecto')}</h2>
          <button type="button" onClick={resetAll} className={MODAL_CLOSE} aria-label={t('common.cerrar')}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{t('proyectos.proyecto_label')}: <span className="text-primary">{pauseModal.nombre}</span></p>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.motivo_pausa')} *</label>
            <textarea
              value={pauseReason}
              onChange={e => setPauseReason(e.target.value)}
              placeholder={t('proyectos.motivo_pausa_placeholder')}
              className={`${INPUT} min-h-[80px] resize-none`}
              rows={3}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.autorizado_por')} *</label>
            <input
              value={pauseAutorizador}
              onChange={e => setPauseAutorizador(e.target.value)}
              placeholder={t('proyectos.autorizado_por_placeholder')}
              className={INPUT}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.fecha_reanudacion')}</label>
            <input
              type="date"
              value={pauseReanudacion}
              onChange={e => setPauseReanudacion(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onConfirm} className={BUTTON_PRIMARY + ' flex-1 justify-center active:scale-[0.98]'}>
            <Pause className="w-4 h-4" /> {t('proyectos.confirmar_pausa')}
          </button>
          <button onClick={resetAll} className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted text-muted-foreground font-medium transition-all">
            {t('common.cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProyectoPauseModal;
