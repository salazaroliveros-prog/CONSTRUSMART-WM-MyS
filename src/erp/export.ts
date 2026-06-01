import { RenglonPresupuesto } from './types';
import { EMPRESA, fmtQ, costoDirectoUnitario, precioUnitarioVenta, TIPOLOGIA_LABEL } from './utils';

const calcRow = (r: RenglonPresupuesto) => {
  const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
  const pv = precioUnitarioVenta(cd);
  return { cd, pv, total: pv * r.cantidad };
};

// Función para generar resumen de materiales
const getResumenMateriales = (renglones: RenglonPresupuesto[]) => {
  const materiales: Record<string, { unidad: string; cantidad: number; total: number }> = {};
  renglones.forEach(r => {
    if (r.subrenglones) {
      r.subrenglones.forEach(sub => {
        const key = `${sub.nombreMaterial}-${sub.unidad}`;
        const cant = sub.cantidadUnitaria * r.cantidad;
        const tot = cant * sub.precioUnitario;
        if (!materiales[key]) {
          materiales[key] = { unidad: sub.unidad, cantidad: 0, total: 0 };
        }
        materiales[key].cantidad += cant;
        materiales[key].total += tot;
      });
    }
  });
  return Object.entries(materiales).map(([nombre, data]) => ({ nombre, ...data }));
};


export const exportCSV = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string) => {
  const rows: string[] = [];
  rows.push(`${EMPRESA.nombre}`);
  rows.push(`${EMPRESA.nombre} - ${EMPRESA.eslogan}`);
  rows.push(`Proyecto: ${proyecto};Tipologia: ${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia}`);
  rows.push('');
  rows.push('Codigo;Renglon;Unidad;Cantidad;Materiales;Mano Obra;Equipo;Costo Directo;Precio Unitario;Total');
  let gran = 0;
  renglones.forEach(r => {
    const { cd, pv, total } = calcRow(r);
    gran += total;
    rows.push(`${r.codigo};${r.nombre};${r.unidad};${r.cantidad};${r.costoMateriales.toFixed(2)};${r.costoManoObra.toFixed(2)};${r.costoEquipo.toFixed(2)};${cd.toFixed(2)};${pv.toFixed(2)};${total.toFixed(2)}`);
  });
  rows.push('');
  rows.push(`;;;;;;;;TOTAL;${gran.toFixed(2)}`);

  // Agregar resumen de materiales
  const materiales = getResumenMateriales(renglones);
  if (materiales.length > 0) {
    rows.push('');
    rows.push('=== RESUMEN DE MATERIALES ===');
    rows.push('Material;Cantidad;Unidad;Subtotal');
    let totalMateriales = 0;
    materiales.forEach(m => {
      totalMateriales += m.total;
      rows.push(`${m.nombre};${m.cantidad.toFixed(2)};${m.unidad};${m.total.toFixed(2)}`);
    });
    rows.push('');
    rows.push(`Total Materiales;;${totalMateriales.toFixed(2)}`);
  }

  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Presupuesto_${proyecto.replace(/\s+/g, '_')}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string) => {
  let gran = 0;
  const filas = renglones.map((r, i) => {
    const { cd, pv, total } = calcRow(r);
    gran += total;
    return `<tr>
      <td>${i + 1}</td><td>${r.codigo}</td><td style="text-align:left">${r.nombre}</td>
      <td>${r.unidad}</td><td>${r.cantidad}</td><td>${fmtQ(cd)}</td><td>${fmtQ(pv)}</td><td style="text-align:right">${fmtQ(total)}</td>
    </tr>`;
  }).join('');

  // Resumen de materiales para PDF
  const materiales = getResumenMateriales(renglones);
  let resumenMatHTML = '';
  if (materiales.length > 0) {
    let totalMat = 0;
    const filasMateria = materiales.map(m => {
      totalMat += m.total;
      return `<tr><td style="text-align:left">${m.nombre}</td><td>${m.cantidad.toFixed(2)}</td><td>${m.unidad}</td><td style="text-align:right">${fmtQ(m.total)}</td></tr>`;
    }).join('');
    resumenMatHTML = `<h2>Resumen de Materiales a Utilizar</h2>
      <table class="t"><thead><tr><th style="text-align:left">Material</th><th>Cantidad</th><th>Unidad</th><th>Subtotal</th></tr></thead>
      <tbody>${filasMateria}<tr class="total"><td style="text-align:left">TOTAL MATERIALES</td><td></td><td></td><td style="text-align:right">${fmtQ(totalMat)}</td></tr></tbody></table>`;
  }

  const desglose = renglones.map(r => {
    const insHTML = r.insumos.map(s => `<tr><td style="text-align:left">${s.nombre}</td><td>${s.tipo}</td><td>${s.unidad}</td><td style="text-align:right">${fmtQ(s.precio)}</td></tr>`).join('');
    const subrenglonHTML = r.subrenglones && r.subrenglones.length > 0 ? 
      `<div style="margin-top:8px;padding:8px;background:#f0fdf4;border-left:3px solid #10b981">
        <b style="color:#047857">Desglose de Materiales:</b>
        <table class="t" style="margin-top:4px"><tbody>
          ${r.subrenglones.map(s => `<tr><td style="text-align:left">${s.nombreMaterial}</td><td>${(s.cantidadUnitaria * r.cantidad).toFixed(2)}</td><td>${s.unidad}</td><td style="text-align:right">${fmtQ(s.cantidadUnitaria * r.cantidad * s.precioUnitario)}</td></tr>`).join('')}
        </tbody></table>
      </div>` : '';
    return `<h4 style="margin:14px 0 4px;color:#1e293b">${r.codigo} — ${r.nombre}</h4>
      <table class="t"><thead><tr><th style="text-align:left">Insumo</th><th>Tipo</th><th>Unidad</th><th>Precio</th></tr></thead><tbody>${insHTML}</tbody></table>${subrenglonHTML}`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Presupuesto ${proyecto}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#334155;margin:32px;font-size:11px}
    .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #f97316;padding-bottom:12px;margin-bottom:8px}
    .logo{width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#0f172a;box-shadow:0 0 6px rgba(249,115,22,0.35);outline:1px solid rgba(249,115,22,0.3)}
.logo img{width:100%;height:100%;object-fit:contain;display:block}
    h1{margin:0;font-size:18px;color:#1e293b}
    .slogan{color:#f97316;font-style:italic;font-size:12px}
    .meta{margin:10px 0;font-size:11px;color:#64748b}
    table.t{width:100%;border-collapse:collapse;margin-top:8px}
    table.t th{background:#1e293b;color:#fff;padding:6px;font-size:10px}
    table.t td{border:1px solid #e2e8f0;padding:5px;text-align:center}
    .total{background:#fff7ed;font-weight:bold}
    .foot{margin-top:24px;text-align:center;color:#94a3b8;font-size:9px;border-top:1px solid #e2e8f0;padding-top:8px}
    h2{color:#f97316;border-bottom:1px solid #fed7aa;padding-bottom:4px;margin-top:28px}
  </style></head><body>
  <div class="head">
    <div class="logo"><img src="/wm-logo.svg" alt="WM" /></div>
    <div><h1>${EMPRESA.nombre}</h1><div class="slogan">${EMPRESA.eslogan}</div></div>
    <div style="margin-left:auto;text-align:right;color:#64748b">PRESUPUESTO DE OBRA<br>${new Date().toLocaleDateString('es-GT')}</div>
  </div>
  <div class="meta"><b>Proyecto:</b> ${proyecto} &nbsp;|&nbsp; <b>Tipología:</b> ${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia} &nbsp;|&nbsp; <b>Renglones:</b> ${renglones.length}</div>
  <h2>Resumen de Renglones</h2>
  <table class="t"><thead><tr><th>#</th><th>Código</th><th style="text-align:left">Descripción</th><th>Unidad</th><th>Cant.</th><th>C. Directo</th><th>P. Unitario</th><th>Total</th></tr></thead>
  <tbody>${filas}<tr class="total"><td colspan="7" style="text-align:right">TOTAL DEL PRESUPUESTO</td><td style="text-align:right">${fmtQ(gran)}</td></tr></tbody></table>
  ${resumenMatHTML}
  <h2>Desglose Unitario de Materiales (APU)</h2>
  ${desglose}
  <div class="foot">Documento generado por el ERP de ${EMPRESA.nombre} — ${EMPRESA.eslogan}<br>Precios sujetos a variación de mercado · Guatemala</div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
};
