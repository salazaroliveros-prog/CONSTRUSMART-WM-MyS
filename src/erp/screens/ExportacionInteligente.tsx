import React, { useState, useCallback } from 'react';
import { useErp } from '../store';
import { Download, FileJson, FileSpreadsheet, FileText, Mail, Plus, Trash2, Clock, Check, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fmtQ, todayISO } from '../utils';
import { CARD, INPUT } from '../ui';

type ExportFormat = 'json' | 'csv' | 'pdf';

interface ReporteProgramado {
  id: string;
  nombre: string;
  tipo: 'ejecutivo' | 'apu' | 'cubicacion' | 'rendimientos' | 'completo';
  formato: ExportFormat;
  frecuencia: 'semanal' | 'mensual';
  activo: boolean;
  ultimoEnvio?: string;
  destinatarios: string;
}

const ExportacionInteligente: React.FC = () => {
  const { proyectos, movimientos, empleados, materiales, presupuestos, avances } = useErp();
  const [exportando, setExportando] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReporteProgramado[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_reportes_programados') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', tipo: 'ejecutivo' as ReporteProgramado['tipo'], formato: 'json' as ExportFormat, frecuencia: 'semanal' as ReporteProgramado['frecuencia'], destinatarios: '' });

  const saveReportes = (r: ReporteProgramado[]) => {
    setReportes(r);
    localStorage.setItem('wm_reportes_programados', JSON.stringify(r));
  };

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === EXPORTAR JSON ===
  const exportarJSON = useCallback(() => {
    setExportando('json');
    setTimeout(() => {
      const data = {
        proyectos: proyectos.map(p => ({
          id: p.id, nombre: p.nombre, ubicacion: p.ubicacion, tipologia: p.tipologia,
          presupuesto: p.presupuestoTotal, fechaInicio: p.fechaInicio, fechaFin: p.fechaFin,
          avanceFisico: p.avanceFisico, avanceFinanciero: p.avanceFinanciero, estado: p.estado,
          factorSobrecosto: p.factorSobrecosto,
        })),
        movimientos: movimientos.map(m => ({
          id: m.id, proyectoId: m.proyectoId, tipo: m.tipo, categoria: m.categoria,
          monto: m.monto, descripcion: m.descripcion, fecha: m.fecha, proveedor: m.proveedor,
        })),
        empleados: empleados.map(e => ({
          id: e.id, nombre: e.nombre, puesto: e.puesto, salarioDiario: e.salarioDiario,
          tipo: e.tipo, activo: e.activo, proyectoIds: e.proyectoIds,
        })),
        materiales: materiales.map(m => ({
          id: m.id, nombre: m.nombre, unidad: m.unidad, stock: m.stock,
          stockMinimo: m.stockMinimo, precioUnitario: m.precioUnitario, categoria: m.categoria,
        })),
        presupuestos: presupuestos.map(p => ({
          id: p.id, proyectoId: p.proyectoId, version: p.version, estado: p.estado,
          totalCD: p.totalCD, totalPV: p.totalPV, renglones: p.renglones?.length || 0,
        })),
        avances: avances.map(a => ({
          id: a.id, proyectoId: a.proyectoId, renglonNombre: a.renglonNombre,
          avanceFisico: a.avanceFisico, cantidadEjecutada: a.cantidadEjecutada, fecha: a.fecha,
        })),
        exportadoEn: new Date().toISOString(),
      };
      downloadBlob(JSON.stringify(data, null, 2), `construsmart-export-${todayISO()}.json`, 'application/json');
      toast.success('JSON exportado exitosamente');
      setExportando(null);
    }, 300);
  }, [proyectos, movimientos, empleados, materiales, presupuestos, avances]);

  // === EXPORTAR CSV ===
  const exportarCSV = useCallback(() => {
    setExportando('csv');
    setTimeout(() => {
      // Construir un CSV plano combinando varios datasets
      const rows: string[][] = [];
      // Header
      rows.push(['CONSTRUSMART ERP - Exportación Completa', `Fecha: ${todayISO()}`]);
      rows.push(['']);
      rows.push(['PROYECTOS']);
      rows.push(['ID', 'Nombre', 'Ubicación', 'Tipología', 'Presupuesto', 'Inicio', 'Fin', 'AvanceFísico%', 'AvanceFinanciero%', 'Estado']);
      proyectos.forEach(p => rows.push([p.id, p.nombre, p.ubicacion, p.tipologia, String(p.presupuestoTotal), p.fechaInicio, p.fechaFin, String(p.avanceFisico), String(p.avanceFinanciero), p.estado]));
      rows.push(['']);
      rows.push(['MOVIMIENTOS FINANCIEROS']);
      rows.push(['ID', 'Proyecto', 'Tipo', 'Categoría', 'Monto', 'Fecha', 'Descripción']);
      movimientos.forEach(m => rows.push([m.id, m.proyectoId, m.tipo, m.categoria, String(m.monto), m.fecha, m.descripcion]));
      rows.push(['']);
      rows.push(['EMPLEADOS']);
      rows.push(['ID', 'Nombre', 'Puesto', 'Salario/Día', 'Tipo', 'Activo']);
      empleados.forEach(e => rows.push([e.id, e.nombre, e.puesto, String(e.salarioDiario), e.tipo, e.activo ? 'Sí' : 'No']));
      rows.push(['']);
      rows.push(['MATERIALES']);
      rows.push(['ID', 'Nombre', 'Unidad', 'Stock', 'Stock Mínimo', 'Precio Unitario']);
      materiales.forEach(m => rows.push([m.id, m.nombre, m.unidad, String(m.stock), String(m.stockMinimo), String(m.precioUnitario)]));

      const csv = rows.map(r => r.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')).join('\n');
      downloadBlob(csv, `construsmart-export-${todayISO()}.csv`, 'text/csv;charset=utf-8');
      toast.success('CSV exportado exitosamente');
      setExportando(null);
    }, 500);
  }, [proyectos, movimientos, empleados, materiales]);

  // === GENERAR REPORTE PDF EJECUTIVO ===
  const generarPDF = useCallback(async () => {
    setExportando('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const reportDiv = document.createElement('div');
      reportDiv.style.cssText = 'padding: 30px; font-family: Arial, sans-serif; max-width: 800px; background: white;';
      reportDiv.innerHTML = `
        <div style="text-align:center;border-bottom:3px solid #f97316;padding-bottom:15px;margin-bottom:20px">
          <h1 style="margin:0;color:#1e293b">CONSTRUCTORA WM</h1>
          <p style="margin:5px 0;color:#f97316;font-style:italic">Edificando el Futuro</p>
          <p style="margin:0;color:#64748b;font-size:11px">Reporte Ejecutivo · ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <h2 style="color:#1e293b;font-size:14px">Resumen General</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px">
          <tr style="background:#f8fafc">
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Total Proyectos</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">${proyectos.length}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Total Empleados</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">${empleados.length}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Total Materiales</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">${materiales.length}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Total Movimientos</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">${movimientos.length}</td>
          </tr>
          <tr style="background:#f8fafc">
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Presupuesto Total</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">Q${fmtQ(proyectos.reduce((a, p) => a + (p.presupuestoTotal || 0), 0))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px"><b>Avance Promedio</b></td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-size:11px">${proyectos.length > 0 ? (proyectos.reduce((a, p) => a + (p.avanceFisico || 0), 0) / proyectos.length).toFixed(0) : 0}%</td>
          </tr>
        </table>
        <h2 style="color:#1e293b;font-size:14px">Proyectos</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px">
          <tr style="background:#f97316;color:white">
            <th style="padding:6px;border:1px solid #f97316;font-size:10px">Nombre</th>
            <th style="padding:6px;border:1px solid #f97316;font-size:10px">Estado</th>
            <th style="padding:6px;border:1px solid #f97316;font-size:10px">Presupuesto</th>
            <th style="padding:6px;border:1px solid #f97316;font-size:10px">Avance</th>
          </tr>
          ${proyectos.map(p => `<tr>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:10px">${p.nombre}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:10px">${p.estado}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:10px">Q${fmtQ(p.presupuestoTotal || 0)}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:10px">${p.avanceFisico || 0}%</td>
          </tr>`).join('')}
        </table>
        <p style="color:#94a3b8;font-size:9px;text-align:center;margin-top:30px">Generado por CONSTRUSMART ERP · ${todayISO()}</p>
      `;
      document.body.appendChild(reportDiv);
      const canvas = await html2canvas(reportDiv, { scale: 2, useCORS: true });
      document.body.removeChild(reportDiv);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`construsmart-reporte-${todayISO()}.pdf`);
      toast.success('PDF exportado exitosamente');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Error al generar PDF');
    }
    setExportando(null);
  }, [proyectos, empleados, materiales, movimientos]);

  // === REPORTES PROGRAMADOS ===
  const agregarReporte = () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    const nuevo: ReporteProgramado = {
      id: Date.now().toString(),
      nombre: form.nombre,
      tipo: form.tipo,
      formato: form.formato,
      frecuencia: form.frecuencia,
      activo: true,
      destinatarios: form.destinatarios,
    };
    saveReportes([...reportes, nuevo]);
    toast.success(`Reporte "${form.nombre}" programado (${form.frecuencia})`);
    setShowForm(false);
    setForm({ nombre: '', tipo: 'ejecutivo', formato: 'json', frecuencia: 'semanal', destinatarios: '' });
  };

  const toggleReporte = (id: string) => {
    saveReportes(reportes.map(r => r.id === id ? { ...r, activo: !r.activo } : r));
  };

  const eliminarReporte = (id: string) => {
    saveReportes(reportes.filter(r => r.id !== id));
    toast.success('Reporte eliminado');
  };

  const ejecutarReporteAhora = (reporte: ReporteProgramado) => {
    if (reporte.formato === 'json') exportarJSON();
    else if (reporte.formato === 'csv') exportarCSV();
    else generarPDF();
    saveReportes(reportes.map(r => r.id === reporte.id ? { ...r, ultimoEnvio: todayISO() } : r));
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-black text-slate-800">Exportación Inteligente</h1>
          <p className="text-xs text-slate-500">Exporta datos a JSON, CSV o PDF y programa reportes automáticos</p>
        </div>
      </div>

      {/* Exportación rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={exportarJSON}
          disabled={exportando === 'json'}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${exportando === 'json' ? 'bg-blue-50 border-blue-300 animate-pulse' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'}`}
        >
          <FileJson className={`w-8 h-8 ${exportando === 'json' ? 'text-blue-500' : 'text-blue-400'}`} />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Exportar JSON</p>
            <p className="text-[10px] text-slate-400">Datos completos del ERP en formato JSON</p>
          </div>
        </button>

        <button
          onClick={exportarCSV}
          disabled={exportando === 'csv'}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${exportando === 'csv' ? 'bg-green-50 border-green-300 animate-pulse' : 'bg-white border-slate-100 hover:border-green-300 hover:shadow-md'}`}
        >
          <FileSpreadsheet className={`w-8 h-8 ${exportando === 'csv' ? 'text-green-500' : 'text-green-400'}`} />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Exportar CSV</p>
            <p className="text-[10px] text-slate-400">Tablas planas para Excel/Sheets</p>
          </div>
        </button>

        <button
          onClick={generarPDF}
          disabled={exportando === 'pdf'}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${exportando === 'pdf' ? 'bg-red-50 border-red-300 animate-pulse' : 'bg-white border-slate-100 hover:border-red-300 hover:shadow-md'}`}
        >
          <FileText className={`w-8 h-8 ${exportando === 'pdf' ? 'text-red-500' : 'text-red-400'}`} />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Reporte PDF</p>
            <p className="text-[10px] text-slate-400">Reporte ejecutivo profesional con membrete</p>
          </div>
        </button>
      </div>

      {/* Reportes programados */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" /> Reportes Programados
          </h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600">
            <Plus className="w-3.5 h-3.5" /> Programar Reporte
          </button>
        </div>

        {showForm && (
          <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre del reporte" className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
              <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value as ReporteProgramado['tipo'] }))} className={INPUT}>
                <option value="ejecutivo">Ejecutivo</option>
                <option value="completo">Completo (todo)</option>
                <option value="apu">APU</option>
                <option value="cubicacion">Cubicación</option>
                <option value="rendimientos">Rendimientos</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={form.formato} onChange={e => setForm(prev => ({ ...prev, formato: e.target.value as ExportFormat }))} className={INPUT}>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF (Ejecutivo)</option>
              </select>
              <select value={form.frecuencia} onChange={e => setForm(prev => ({ ...prev, frecuencia: e.target.value as ReporteProgramado['frecuencia'] }))} className={INPUT}>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <input value={form.destinatarios} onChange={e => setForm(prev => ({ ...prev, destinatarios: e.target.value }))} placeholder="Destinatarios (email separados por coma)" className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
            <div className="flex gap-2">
              <button onClick={agregarReporte} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold">Programar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
            </div>
          </div>
        )}

        {reportes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Sin reportes programados. Crea uno para recibirlo periódicamente.</p>
        ) : (
          <div className="space-y-2">
            {reportes.map(r => (
              <div key={r.id} className={`flex items-start justify-between p-3 rounded-lg border ${r.activo ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{r.nombre}</span>
                    <button onClick={() => toggleReporte(r.id)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {r.activo ? 'Activo' : 'Pausado'}
                    </button>
                  </div>
                  <div className="flex gap-2 text-[10px] text-slate-400">
                    <span>📄 {r.tipo}</span>
                    <span>💾 {r.formato.toUpperCase()}</span>
                    <span>🔄 {r.frecuencia}</span>
                    {r.destinatarios && <span>📬 {r.destinatarios}</span>}
                    {r.ultimoEnvio && <span>✅ Último: {r.ultimoEnvio}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => ejecutarReporteAhora(r)} className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600 flex items-center gap-1">
                    <Send className="w-3 h-3" /> Ejecutar
                  </button>
                  <button onClick={() => eliminarReporte(r.id)} aria-label="Eliminar reporte" className="p-1 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-600 mb-2">📋 Guía de Exportación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">JSON</p>
            <p>Exporta todos los datos del ERP en un único archivo JSON estructurado. Ideal para integraciones API, backup o análisis externo.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">CSV</p>
            <p>Exporta tablas planas separadas por proyectos, movimientos, empleados y materiales. Compatible con Excel, Google Sheets y herramientas BI.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">PDF</p>
            <p>Reporte ejecutivo profesional con membrete de CONSTRUCTORA WM, tabla de proyectos y KPIs. Listo para imprimir o compartir.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportacionInteligente;