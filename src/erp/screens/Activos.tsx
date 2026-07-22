import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Search, Wrench, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { fmtQ } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';

const TIPOS = ['herramienta', 'equipo', 'vehiculo', 'accesorio'] as const;
const ESTADOS = ['disponible', 'asignado', 'mantenimiento', 'baja'] as const;

const Activos: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { activos, setActivos, proyectos } = useErp();
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState<string>('todos');
  const [estado, setEstado] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const empty = { nombre: '', codigo: '', tipo: 'herramienta' as typeof TIPOS[number], estado: 'disponible' as typeof ESTADOS[number], valor: 0, proyectoId: '' };

  const [form, setForm] = useState(empty);
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return activos.filter(a => {
      if (qq && !`${a.nombre} ${a.codigo}`.toLowerCase().includes(qq)) return false;
      if (tipo !== 'todos' && a.tipo !== tipo) return false;
      if (estado !== 'todos' && a.estado !== estado) return false;
      return true;
    });
  }, [activos, q, tipo, estado]);

  const activosDisponibles = useMemo(() => activos.filter(a => a.estado === 'disponible').length, [activos]);
  const activosAsignados = useMemo(() => activos.filter(a => a.estado === 'asignado').length, [activos]);
  const valorTotalActivos = useMemo(() => activos.reduce((s, a) => s + (Number(a.valor) || 0), 0), [activos]);

  const openCreate = () => { setEditId(null); setForm(empty); setShowForm(true); };
  const openEdit = (a: typeof activos[0]) => {
    setEditId(a.id);
    setForm({ nombre: a.nombre, codigo: a.codigo, tipo: a.tipo, estado: a.estado, valor: a.valor, proyectoId: a.proyectoId || '' });
    setShowForm(true);
  };

  const save = () => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = t('activos.error_nombre');
    if (!form.codigo.trim()) errors.codigo = t('activos.error_codigo');
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = { ...form, valor: Number(form.valor) || 0, fechaAdquisicion: new Date().toISOString().slice(0, 10) };
    if (editId) {
      setActivos(arr => arr.map(a => a.id === editId ? { ...a, ...payload } : a));
      toast.success(t('activos.guardar_exito'));
    } else {
      setActivos(arr => [{ id: crypto.randomUUID(), ...payload }, ...arr]);
      toast.success(t('activos.guardar_exito'));
    }
    setShowForm(false);
  };

  const remove = (id: string) => {
    setActivos(arr => arr.filter(a => a.id !== id));
    toast.success(t('activos.eliminar_exito'));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Wrench className="w-6 h-6 text-indigo-500" /> {t('activos.titulo')}
        </h1>
        <button onClick={openCreate} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('activos.nuevo_activo')}</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('activos.buscar_placeholder')} className="pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-card outline-none" />
        </div>
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-card">
          <option value="todos">{t('activos.todos_tipos')}</option>
          {TIPOS.map(tp => <option key={tp} value={tp}>{t(`activos.tipo_${tp}`)}</option>)}
        </select>
        <select value={estado} onChange={e => setEstado(e.target.value)} className="text-xs px-3 py-2 rounded-lg border border-border bg-card">
          <option value="todos">{t('activos.todos_estados')}</option>
          {ESTADOS.map(e => <option key={e} value={e}>{t(`activos.estado_${e}`)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg text-center"><p className="text-xs text-indigo-600 dark:text-indigo-400">{t('activos.total')}</p><p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{activos.length}</p></div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center"><p className="text-xs text-emerald-600 dark:text-emerald-400">{t('activos.disponibles')}</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{activosDisponibles}</p></div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center"><p className="text-xs text-amber-600 dark:text-amber-400">{t('activos.asignados')}</p><p className="text-xl font-bold text-amber-700 dark:text-amber-300">{activosAsignados}</p></div>
        <div className="p-3 bg-muted/30 rounded-lg text-center"><p className="text-xs text-muted-foreground">{t('activos.valor_total')}</p><p className="text-xl font-bold text-foreground">{fmtQ(valorTotalActivos)}</p></div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-x-auto">
        <table className="w-full text-xs" role="table" aria-label={t('activos.titulo')}>
          <thead><tr className="bg-muted/30">
            <th className="text-left p-2" scope="col">{t('activos.columna_codigo')}</th>
            <th className="text-left p-2" scope="col">{t('activos.columna_nombre')}</th>
            <th className="text-left p-2" scope="col">{t('activos.columna_tipo')}</th>
            <th className="text-left p-2" scope="col">{t('activos.columna_estado')}</th>
            <th className="text-left p-2" scope="col">{t('activos.columna_ubicacion')}</th>
            <th className="text-left p-2" scope="col">{t('activos.columna_valor')}</th>
            <th className="text-right p-2" scope="col">{t('activos.columna_acciones')}</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-t hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring" tabIndex={0} role="row">
                <td className="p-2 font-mono text-muted-foreground truncate" title={a.codigo}>{a.codigo}</td>
                <td className="p-2 font-medium text-muted-foreground truncate" title={a.nombre}>{a.nombre}</td>
                <td className="p-2 text-muted-foreground truncate">{t(`activos.tipo_${a.tipo}`)}</td>
                <td className="p-2 truncate"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  a.estado === 'disponible' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                  a.estado === 'asignado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  a.estado === 'mantenimiento' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>{t(`activos.estado_${a.estado}`)}</span></td>
                <td className="p-2 text-muted-foreground truncate" title={proyectos.find(p => p.id === a.proyectoId)?.nombre || '-'}>{proyectos.find(p => p.id === a.proyectoId)?.nombre || '-'}</td>
                <td className="p-2 font-mono">{fmtQ(Number(a.valor || 0))}</td>
                <td className="p-2 text-right">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('activos.editar')} ${a.nombre}`}><Edit2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" /></button>
                  <button onClick={async () => { 
                    try { 
                      await confirmAction({ title: t('activos.confirmar_eliminar'), okText: t('common.si'), cancelText: t('common.cancelar'), variant: 'destructive' }); 
                      remove(a.id); 
                    } catch (error) {
                      // Usuario canceló la acción
                      console.log('Acción cancelada por usuario');
                    } 
                  }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('activos.eliminar')} ${a.nombre}`}><Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground"><Wrench className="w-6 h-6 mx-auto mb-1 opacity-40" aria-hidden="true" />{t('activos.sin_activos')}</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-card rounded-xl p-5 w-full max-w-md shadow-sm">
            <h3 className="font-bold mb-3 truncate" title={editId ? t('activos.editar_activo') : t('activos.nuevo_activo')}>{editId ? t('activos.editar_activo') : t('activos.nuevo_activo')}</h3>
            <div className="grid gap-2">
              <div>
                <label htmlFor="activo-nombre" className="text-xs text-muted-foreground mb-1 block">{t('activos.columna_nombre')}</label>
                <input id="activo-nombre" value={form.nombre} onChange={e => { set('nombre', e.target.value); if (formErrors.nombre) setFormErrors(f => ({ ...f, nombre: '' })); }} placeholder={t('activos.columna_nombre')} className={`px-3 py-2 border rounded-lg text-sm ${formErrors.nombre ? 'border-red-500' : ''}`} />
                {formErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.nombre}</p>}
              </div>
              <div>
                <label htmlFor="activo-codigo" className="text-xs text-muted-foreground mb-1 block">{t('activos.columna_codigo')}</label>
                <input id="activo-codigo" value={form.codigo} onChange={e => { set('codigo', e.target.value); if (formErrors.codigo) setFormErrors(f => ({ ...f, codigo: '' })); }} placeholder={t('activos.columna_codigo')} className={`px-3 py-2 border rounded-lg text-sm ${formErrors.codigo ? 'border-red-500' : ''}`} />
                {formErrors.codigo && <p className="text-xs text-red-500 mt-0.5">{formErrors.codigo}</p>}
              </div>
              <div>
                <label htmlFor="activo-tipo" className="text-xs text-muted-foreground mb-1 block">{t('activos.columna_tipo', 'Tipo')}</label>
                <select id="activo-tipo" value={form.tipo} onChange={e => set('tipo', e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                  {TIPOS.map(tp => <option key={tp} value={tp}>{t(`activos.tipo_${tp}`)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="activo-estado" className="text-xs text-muted-foreground mb-1 block">{t('activos.columna_estado', 'Estado')}</label>
                <select id="activo-estado" value={form.estado} onChange={e => set('estado', e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                  {ESTADOS.map(e => <option key={e} value={e}>{t(`activos.estado_${e}`)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="activo-valor" className="text-xs text-muted-foreground mb-1 block">{t('activos.columna_valor')}</label>
                <input id="activo-valor" type="number" inputMode="decimal" value={form.valor} onChange={e => set('valor', Number(e.target.value))} placeholder={t('activos.columna_valor')} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button onClick={save} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('common.guardar')}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('common.cancelar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Activos;