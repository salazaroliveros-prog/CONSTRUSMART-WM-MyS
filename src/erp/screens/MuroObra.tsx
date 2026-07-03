import React, { useMemo, useState, useEffect } from 'react';
import { z } from 'zod';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { todayISO } from '../utils';
import {
  MessageSquare, Plus, Heart, MessageCircle,
  CheckCircle2, AlertTriangle, Shield, Calendar, User, Send,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type TipoPublicacion = 'avance' | 'calidad' | 'seguridad' | 'general';

const MuroObra: React.FC = () => {
  const { proyectos, user, publicacionesMuro, addPublicacionMuro, addComentarioMuro, likePublicacionMuro } = useErp();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState<TipoPublicacion | 'todos'>('todos');
  const [proyectoFilter, setProyectoFilter] = useState('');
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoPublicacion>('general');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const publicacionSchema = z.object({
    texto: z.string().min(1, 'Escribe algo para publicar'),
    tipo: z.enum(['avance', 'calidad', 'seguridad', 'general'])
  });
  const [comentarioInput, setComentarioInput] = useState('');
  const [comentando, setComentando] = useState<string | null>(null);

  useEffect(() => { setLoading(false); }, []);

  const publicacionesFiltradas = useMemo(() => {
    let f = publicacionesMuro;
    if (proyectoFilter) f = f.filter(p => p.proyectoId === proyectoFilter);
    if (filterTipo !== 'todos') f = f.filter(p => p.tipo === filterTipo);
    return [...f].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [publicacionesMuro, proyectoFilter, filterTipo]);

  const handlePublicar = () => {
    const result = publicacionSchema.safeParse({ texto: nuevoTexto, tipo: nuevoTipo });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        if (e.path[0]) errors[e.path[0] as string] = e.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    addPublicacionMuro({
      proyectoId: proyectoFilter || proyectos[0]?.id || '',
      autor: user?.nombre || 'Anónimo',
      contenido: nuevoTexto.trim(),
      tipo: nuevoTipo,
      fotos: [],
      createdAt: new Date().toISOString(),
      likes: 0,
      comentarios: [],
    });
    toast.success('Publicación creada');
    setNuevoTexto('');
    setShowForm(false);
  };

  const handleComentar = (pubId: string) => {
    if (!comentarioInput.trim()) return;
    addComentarioMuro(pubId, {
      autor: user?.nombre || 'Anónimo',
      contenido: comentarioInput.trim(),
      createdAt: new Date().toISOString(),
    });
    setComentarioInput('');
    setComentando(null);
  };

  const tipoConfig: Record<TipoPublicacion, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    avance: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Avance', icon: CheckCircle2 },
    calidad: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Calidad', icon: Shield },
    seguridad: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Seguridad', icon: AlertTriangle },
    general: { color: 'text-slate-600', bg: 'bg-slate-50', label: 'General', icon: MessageSquare },
  };

  if (loading) return <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-500" /> Muro de Obra
        </h1>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) setFormErrors({}); }} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors" aria-label="Crear nueva publicación">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Nueva Publicación
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
        {(['todos', 'avance', 'calidad', 'seguridad', 'general'] as const).map(t => (
          <button key={t} onClick={() => setFilterTipo(t)} className={`px-2.5 py-1.5 text-[10px] rounded-lg font-medium transition-colors ${filterTipo === t ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} aria-label={`Filtrar por ${t === 'todos' ? 'Todos' : tipoConfig[t].label}`}>
            {t === 'todos' ? 'Todos' : tipoConfig[t].label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">{user?.nombre || 'Anónimo'}</span>
            <span className="text-[10px] text-slate-400">— {todayISO()}</span>
          </div>
          <textarea value={nuevoTexto} onChange={e => setNuevoTexto(e.target.value)} placeholder="¿Qué hay de nuevo en la obra?" rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-400 resize-none mb-3" />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1">
              {(['avance', 'calidad', 'seguridad', 'general'] as const).map(t => {
                const cfg = tipoConfig[t];
                return (
                  <button key={t} onClick={() => setNuevoTipo(t)} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-full font-medium transition-colors ${nuevoTipo === t ? `${cfg.bg} ${cfg.color}` : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <cfg.icon className="w-3 h-3" aria-hidden="true" /> {cfg.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600">Cancelar</button>
              <button onClick={handlePublicar} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 font-medium">Publicar</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {publicacionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-slate-400 border border-slate-100">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Sin publicaciones aún. ¡Sé el primero en publicar!
          </div>
        ) : publicacionesFiltradas.map(pub => {
          const cfg = tipoConfig[pub.tipo];
          return (
            <div key={pub.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {pub.autor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-700 truncate">{pub.autor}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {pub.createdAt.slice(0, 10)}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{pub.contenido}</p>

              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <button onClick={() => likePublicacionMuro(pub.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors" aria-label={`Me gusta ${pub.likes}`}>
                  <Heart className="w-3.5 h-3.5" aria-hidden="true" /> {pub.likes}
                </button>
                <button onClick={() => setComentando(comentando === pub.id ? null : pub.id)} className="flex items-center gap-1 hover:text-indigo-500 transition-colors" aria-label={`Comentarios ${pub.comentarios.length}`}>
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> {pub.comentarios.length}
                </button>
              </div>

              {pub.comentarios.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2 space-y-1.5">
                  {pub.comentarios.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0 mt-0.5">
                        {c.autor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-600">{c.autor}</span>
                        <span className="text-[10px] text-slate-400 ml-1">{c.createdAt.slice(0, 10)}</span>
                        <p className="text-xs text-slate-600">{c.contenido}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {comentando === pub.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={comentarioInput}
                    onChange={e => setComentarioInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComentar(pub.id)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                    autoFocus
                  />
                  <button onClick={() => handleComentar(pub.id)} className="px-2 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MuroObra;
