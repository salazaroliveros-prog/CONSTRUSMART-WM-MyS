import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { fmtQ } from '../utils';
import { Heart, MessageCircle, Send, Image, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

const mensajeSchema = z.object({
  texto: z.string().min(1, 'Escribe algo para publicar').max(500, 'Máximo 500 caracteres'),
});

type TipoPublicacion = 'avance' | 'calidad' | 'seguridad' | 'general';

const TIPOS: Record<TipoPublicacion, { label: string; color: string }> = {
  avance: { label: 'Avance', color: 'text-blue-600' },
  calidad: { label: 'Calidad', color: 'text-emerald-600' },
  seguridad: { label: 'Seguridad', color: 'text-red-600' },
  general: { label: 'General', color: 'text-slate-500 dark:text-slate-400' },
};

const MuroObra: React.FC = () => {
  const { t } = useTranslation();
  const { publicaciones: publicacionesMuro, proyectos, addPublicacionMuro, addComentarioMuro, likePublicacionMuro, currentProjectId } = useErp();
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoPublicacion | 'todos'>('todos');
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoPublicacion>('general');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return (publicacionesMuro || []).filter(p => {
      if (currentProjectId && currentProjectId !== 'none' && p.proyectoId !== currentProjectId) return false;
      if (tipoFiltro !== 'todos' && p.tipo !== tipoFiltro) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [publicacionesMuro, currentProjectId, tipoFiltro]);

  const handlePublicar = () => {
    const result = mensajeSchema.safeParse({ texto: nuevoTexto });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const mapped: Record<string, string> = {};
      if (fieldErrors.texto) mapped.texto = fieldErrors.texto[0];
      setErrores(mapped);
      return;
    }
    setErrores({});
    addPublicacionMuro({
      proyectoId: currentProjectId || filtroProyecto || 'general',
      texto: nuevoTexto.trim(),
      tipo: nuevoTipo,
      likes: 0,
      comentarios: [],
      createdAt: new Date().toISOString(),
    });
    setNuevoTexto('');
    toast.success(t('muro.publicacion_creada', 'Publicación creada'));
  };

  const handleComentario = (id: string) => {
    const texto = comentarios[id]?.trim();
    if (!texto) return;
    addComentarioMuro(id, texto);
    setComentarios(prev => ({ ...prev, [id]: '' }));
    toast.success(t('muro.comentario_agregado', 'Comentario agregado'));
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2 truncate" title={t('muro.titulo', 'Muro de Obra')}><Image className="w-5 h-5 text-primary" aria-hidden="true" /> {t('muro.titulo', 'Muro de Obra')}</h1>
        <div className="flex flex-wrap gap-2">
          <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value as any)} className={`${INPUT} text-xs`} aria-label={t('muro.filtrar_tipo', 'Filtrar por tipo')}>
            <option value="todos">{t('muro.todos', 'Todos')}</option>
            {Object.entries(TIPOS).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex gap-2 mb-2">
          {(['avance', 'calidad', 'seguridad', 'general'] as TipoPublicacion[]).map(tp => (
            <button key={tp} onClick={() => setNuevoTipo(tp)} aria-label={t('muro.tipo_' + tp, TIPOS[tp].label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${nuevoTipo === tp ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}>
              {TIPOS[tp].label}
            </button>
          ))}
        </div>
        <label htmlFor="muro-texto" className="text-xs text-muted-foreground mb-1 block">{t('muro.publicar', 'Nueva publicación')}</label>
        <textarea id="muro-texto" value={nuevoTexto} onChange={e => { setNuevoTexto(e.target.value); setErrores(prev => ({ ...prev, texto: '' })); }} placeholder={t('muro.placeholder', '¿Qué hay de nuevo en la obra?')} rows={2} className={`${INPUT} resize-none mb-2`} />
        {errores.texto && <p className="text-xs text-red-500 mb-2">{errores.texto}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={() => { setNuevoTexto(''); setErrores({}); }} className={`${BUTTON_SECONDARY} text-xs`}>{t('common.cancelar', 'Cancelar')}</button>
          <button onClick={handlePublicar} className={`${BUTTON_PRIMARY} text-xs`}>{t('muro.publicar', 'Publicar')}</button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground"><p className="text-sm">{t('muro.sin_publicaciones', 'Sin publicaciones aún')}</p></div>
        )}
        {filtered.map(pub => {
          const cfg = TIPOS[pub.tipo] || TIPOS.general;
          return (
            <div key={pub.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-muted-foreground">{pub.createdAt ? new Date(pub.createdAt).toLocaleDateString('es-GT') : '—'}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{pub.texto}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => likePublicacionMuro(pub.id)} aria-label={t('muro.like', 'Me gusta')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                  <Heart className="w-4 h-4" aria-hidden="true" /> {pub.likes}
                </button>
                <button onClick={() => {}} aria-label={t('muro.comentar', 'Comentar')} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  <MessageCircle className="w-4 h-4" aria-hidden="true" /> {pub.comentarios.length}
                </button>
              </div>
              {(pub.comentarios || []).length > 0 && (
                <div className="mt-3 space-y-2">
                  {pub.comentarios.map(c => (
                    <div key={c.id} className="bg-muted/40 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{c.autor}</span>
                        <span className="text-[10px] text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-GT') : '—'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.texto}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <input value={comentarios[pub.id] || ''} onChange={e => setComentarios(prev => ({ ...prev, [pub.id]: e.target.value }))} placeholder={t('muro.placeholder_comentario', 'Escribe un comentario...')} className={`${INPUT} text-xs flex-1`} />
                <button onClick={() => handleComentario(pub.id)} aria-label={t('muro.enviar_comentario', 'Enviar comentario')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  <Send className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MuroObra;