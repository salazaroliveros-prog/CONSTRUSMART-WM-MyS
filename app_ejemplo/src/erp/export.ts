import { RenglonPresupuesto } from './types';
import { EMPRESA, fmtQ, costoDirectoUnitario, precioUnitarioVenta, TIPOLOGIA_LABEL } from './utils';

const calcRow = (r: RenglonPresupuesto) => {
  const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
  const pv = precioUnitarioVenta(cd);
  return { cd, pv, total: pv * r.cantidad };
};

export const exportCSV = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string) => {
  const rows: string[] = [];
  rows.push(`${EMPRESA.nombre} - ${EMPRESA.eslogan}`);
  rows.push(`Presupuesto: ${proyecto};Tipologia: ${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia}`);
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

  const desglose = renglones.map(r => {
    const ins = r.insumos.map(s => `<tr><td style="text-align:left">${s.nombre}</td><td>${s.tipo}</td><td>${s.unidad}</td><td style="text-align:right">${fmtQ(s.precio)}</td></tr>`).join('');
    return `<h4 style="margin:14px 0 4px;color:#1e293b">${r.codigo} — ${r.nombre}</h4>
      <table class="t"><thead><tr><th style="text-align:left">Insumo</th><th>Tipo</th><th>Unidad</th><th>Precio</th></tr></thead><tbody>${ins}</tbody></table>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Presupuesto ${proyecto}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#334155;margin:32px;font-size:11px}
    .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #f97316;padding-bottom:12px;margin-bottom:8px}
    .logo{width:54px;height:54px;border-radius:10px;background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px}
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
    <div class="logo">WM</div>
    <div><h1>${EMPRESA.nombre}</h1><div class="slogan">${EMPRESA.eslogan}</div></div>
    <div style="margin-left:auto;text-align:right;color:#64748b">PRESUPUESTO DE OBRA<br>${new Date().toLocaleDateString('es-GT')}</div>
  </div>
  <div class="meta"><b>Proyecto:</b> ${proyecto} &nbsp;|&nbsp; <b>Tipología:</b> ${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia} &nbsp;|&nbsp; <b>Renglones:</b> ${renglones.length}</div>
  <h2>Resumen de Renglones</h2>
  <table class="t"><thead><tr><th>#</th><th>Código</th><th style="text-align:left">Descripción</th><th>Unidad</th><th>Cant.</th><th>C. Directo</th><th>P. Unitario</th><th>Total</th></tr></thead>
  <tbody>${filas}<tr class="total"><td colspan="7" style="text-align:right">TOTAL DEL PRESUPUESTO</td><td style="text-align:right">${fmtQ(gran)}</td></tr></tbody></table>
  <h2>Desglose Unitario de Materiales (APU)</h2>
  ${desglose}
  <div class="foot">Documento generado por el ERP de ${EMPRESA.nombre} — ${EMPRESA.eslogan}<br>Precios sujetos a variación de mercado · Guatemala</div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
};
