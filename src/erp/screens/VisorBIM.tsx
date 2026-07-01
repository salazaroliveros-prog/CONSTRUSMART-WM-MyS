import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Link2, Unlink, Ruler, TrendingUp, Construction, Download, ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

type TabBIM = 'visor' | 'vincular' | 'cubicacion' | 'avance';

export default function VisorBIM() {
  const { t } = useTranslation();
  const { proyectos, presupuestos, selectedProyectoId, setSelectedProyectoId, setView } = useErp();
  const [tab, setTab] = useState<TabBIM>('visor');
  const [elementoSeleccionado, setElementoSeleccionado] = useState<any>(null);
  const [vinculaciones, setVinculaciones] = useState<Record<string, string>>({});
  const [selRenglon, setSelRenglon] = useState('');
  const [cubicacion, setCubicacion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Elementos simulados del modelo IFC (memorizados para estabilidad de referencias)
  const elementosModelo = useMemo(() => [
    { id: 'e1', guid: '3O2$q4k5L8wX9zA1', nombre: 'Muro Norte - Planta Baja', tipo: 'IfcWallStandardCase', cantidad: 145.2, unidad: 'm²' },
    { id: 'e2', guid: '1aB3cD5eF7gH9iJ2', nombre: 'Columna C-01', tipo: 'IfcColumn', cantidad: 3.8, unidad: 'm³' },
    { id: 'e3', guid: '2bC4dE6fG8hJ0kL3', nombre: 'Losa Cubierta Nivel 2', tipo: 'IfcSlab', cantidad: 210.5, unidad: 'm²' },
    { id: 'e4', guid: '4cD5eF6gH7iJ8kL1', nombre: 'Ventana V-12', tipo: 'IfcWindow', cantidad: 12, unidad: 'und' },
    { id: 'e5', guid: '5dE6fG7hH8iJ9kL2', nombre: 'Puerta P-03', tipo: 'IfcDoor', cantidad: 8, unidad: 'und' },
    { id: 'e6', guid: '6eF7gH8hI9jK0lM3', nombre: 'Instalación Sanitaria', tipo: 'IfcFlowSegment', cantidad: 85.3, unidad: 'm' },
  ], []);

  const presupuestoActual = useMemo(() => presupuestos.find(p => p.proyectoId === selectedProyectoId), [presupuestos, selectedProyectoId]);
  const renglones = useMemo(() => presupuestoActual?.renglones || [], [presupuestoActual]);

  React.useEffect(() => {
    setTimeout(() => setLoading(false), 400);
  }, []);

  const handleVincular = useCallback((elementoId: string) => {
    if (!selRenglon) {
      toast.error('Selecciona un renglón');
      return;
    }
    setVinculaciones(prev => ({ ...prev, [elementoId]: selRenglon }));
    toast.success('Vinculación creada');
  }, [selRenglon]);

  const handleDesvincular = useCallback((elementoId: string) => {
    setVinculaciones(prev => {
      const next = { ...prev };
      delete next[elementoId];
      return next;
    });
    toast.success('Vinculación eliminada');
  }, []);

  const generarCubicacion = useCallback(() => {
    const elementosVinculados = elementosModelo.filter(el => vinculaciones[el.id]);
    if (elementosVinculados.length === 0) {
      toast.error('Vincula al menos un elemento');
      return;
    }
    const resultado = elementosVinculados.map(el => ({
      elemento: el.nombre,
      renglon: renglones.find(r => r.id === vinculaciones[el.id])?.nombre || 'Desconocido',
      cantidad: el.cantidad,
      unidad: el.unidad,
      precioUnitario: renglones.find(r => r.id === vinculaciones[el.id])?.precioUnitario || 0,
      total: el.cantidad * (renglones.find(r => r.id === vinculaciones[el.id])?.precioUnitario || 0),
    }));
    setCubicacion(resultado);
    toast.success('Cubicación generada');
  }, [vinculaciones, renglones, elementosModelo]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6" />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              BIM - Vinculación ERP
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Vincula elementos del modelo IFC con el ERP y extrae cubicaciones</p>
        </div>
      </div>

      {/* Selector de proyecto */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
        <Label className="text-xs text-gray-600">Proyecto</Label>
        <select
          value={selectedProyectoId || ''}
          onChange={e => setSelectedProyectoId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Selecciona un proyecto</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as TabBIM)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="visor"><Eye className="w-4 h-4 mr-1" /> Visor 3D</TabsTrigger>
          <TabsTrigger value="vincular"><Link2 className="w-4 h-4 mr-1" /> Vincular Renglones</TabsTrigger>
          <TabsTrigger value="cubicacion"><Ruler className="w-4 h-4 mr-1" /> Cubicación</TabsTrigger>
          <TabsTrigger value="avance"><TrendingUp className="w-4 h-4 mr-1" /> Avance vs Campo</TabsTrigger>
        </TabsList>

        {/* Visor 3D simulado */}
        <TabsContent value="visor" className="space-y-3">
          <Card className="p-6 bg-slate-50 border-slate-200">
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="text-white text-center">
                <Maximize className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm opacity-70">Visor 3D - Carga tu modelo IFC</p>
                <Button size="sm" className="mt-3">
                  <Download className="w-4 h-4 mr-1" /> Cargar Modelo
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Vincular */}
        <TabsContent value="vincular" className="space-y-3">
          <Card className="p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Construction className="w-5 h-5" /> Elementos del Modelo BIM
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <Label className="text-xs text-blue-800">Renglón a vincular</Label>
              <select value={selRenglon} onChange={e => setSelRenglon(e.target.value)} className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm">
                <option value="">— Renglón —</option>
                {renglones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {elementosModelo.map(el => (
                <Card key={el.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{el.nombre}</p>
                    <p className="text-[10px] text-gray-500">{el.tipo} · {el.cantidad} {el.unidad}</p>
                  </div>
                  <div className="flex gap-2">
                    {vinculaciones[el.id] ? (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => handleDesvincular(el.id)}>
                        <Unlink className="w-3 h-3 mr-1" /> Desvincular
                      </Badge>
                    ) : (
                      <Badge variant="default" className="cursor-pointer" onClick={() => handleVincular(el.id)}>
                        <Link2 className="w-3 h-3 mr-1" /> Vincular
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Cubicación */}
        <TabsContent value="cubicacion" className="space-y-3">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800">Cubicación</h3>
              <Button size="sm" onClick={generarCubicacion}>
                <Ruler className="w-4 h-4 mr-1" /> Generar
              </Button>
            </div>
            {cubicacion.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Elemento</TableHead>
                    <TableHead>Renglón</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cubicacion.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{item.elemento}</TableCell>
                      <TableCell className="text-xs">{item.renglon}</TableCell>
                      <TableCell className="text-xs">{item.cantidad} {item.unidad}</TableCell>
                      <TableCell className="text-xs">Q{item.precioUnitario.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-bold">Q{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Vincula elementos para generar la cubicación.</p>
            )}
          </Card>
        </TabsContent>

        {/* Avance vs Campo */}
        <TabsContent value="avance" className="space-y-3">
          <Card className="p-4">
            <h3 className="font-bold text-slate-800 mb-3">Avance vs Campo</h3>
            <p className="text-xs text-gray-500">Comparativa entre avance modelado en BIM y avance físico registrado en campo.</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-blue-600 font-bold">MODELADO (BIM)</p>
                <p className="text-2xl font-bold text-blue-700">78%</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-[10px] text-emerald-600 font-bold">CAMPO (ERP)</p>
                <p className="text-2xl font-bold text-emerald-700">72%</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}