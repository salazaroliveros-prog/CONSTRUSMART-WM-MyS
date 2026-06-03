import { RenglonPresupuesto } from './types';
import { EMPRESA, fmtQ, costoDirectoUnitario, precioUnitarioVenta, TIPOLOGIA_LABEL, COSTOS_INDIRECTOS, ADMINISTRACION, IMPREVISTOS, UTILIDAD, HERRAMIENTA_MENOR } from './utils';

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
  const fecha = new Date().toLocaleDateString('es-GT');
  const rows: string[] = [];
  rows.push(`${EMPRESA.nombre}`);
  rows.push(`${EMPRESA.nombre} - ${EMPRESA.eslogan}`);
  rows.push(`"${EMPRESA.direccion || ''}"`);
  rows.push(`"Tel: ${EMPRESA.telefono || ''} | Email: ${EMPRESA.email || ''}"`);
  rows.push(`Fecha: ${fecha}`);
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

export const exportPDF = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string, firma?: string) => {
  let gran = 0;
  let granDir = 0;
  const filas = renglones.map((r, i) => {
    const { cd, pv, total } = calcRow(r);
    gran += total;
    granDir += cd * r.cantidad;
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
    resumenMatHTML = `
      <div class="section">
        <div class="section-title">📦 Resumen de Materiales a Utilizar</div>
        <table class="t"><thead><tr><th style="text-align:left">Material</th><th>Cantidad</th><th>Unidad</th><th>Subtotal</th></tr></thead>
        <tbody>${filasMateria}<tr class="total"><td style="text-align:left;font-weight:bold">TOTAL MATERIALES</td><td></td><td></td><td style="text-align:right;font-weight:bold">${fmtQ(totalMat)}</td></tr></tbody></table>
      </div>`;
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

  const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
  const firmaHTML = firma 
    ? `<div style="margin-top:30px;padding-top:20px;border-top:2px solid #e2e8f0">
        <div style="margin-bottom:4px;font-size:10px;color:#64748b">Firma del responsable:</div>
        <img src="${firma}" style="max-height:60px;border:1px solid #e2e8f0;border-radius:4px;padding:4px" />
        <div style="margin-top:4px;font-size:9px;color:#94a3b8">Vo.Bo. Residente de Obra</div>
       </div>`
    : '';

  // Cálculo de márgenes
  const indirectos = granDir * COSTOS_INDIRECTOS;
  const administracion = (granDir + indirectos) * ADMINISTRACION;
  const imprevistos = (granDir + indirectos + administracion) * IMPREVISTOS;
  const utilidad = (granDir + indirectos + administracion + imprevistos) * UTILIDAD;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Presupuesto ${proyecto}</title>
  <style>
    @page { margin: 20mm 15mm }
    body{font-family:Arial,Helvetica,sans-serif;color:#334155;margin:0;padding:0;font-size:11px;line-height:1.4}
    .header{border-bottom:3px solid #f97316;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
    .logo{width:60px;height:60px;border-radius:12px;overflow:hidden;background:#0f172a;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .logo img{width:100%;height:100%;object-fit:contain;display:block}
    .empresa-info{flex:1}
    .empresa-info h1{margin:0;font-size:20px;color:#0f172a;letter-spacing:-0.3px}
    .empresa-info .slogan{color:#f97316;font-style:italic;font-size:12px;margin:2px 0}
    .empresa-info .datos{color:#64748b;font-size:9px;margin-top:4px}
    .doc-ref{text-align:right;flex-shrink:0}
    .doc-ref .tit{font-size:16px;font-weight:bold;color:#f97316}
    .doc-ref .subt{font-size:9px;color:#64748b;margin-top:2px}
    .meta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:20px;display:flex;flex-wrap:wrap;gap:8px 24px;font-size:10px}
    .meta-item{display:flex;flex-direction:column}
    .meta-item .label{color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:0.5px}
    .meta-item .value{font-weight:bold;color:#0f172a;font-size:11px}
    .section{margin-bottom:24px}
    .section-title{color:#f97316;font-size:13px;font-weight:bold;border-bottom:2px solid #fed7aa;padding-bottom:6px;margin-bottom:10px}
    table.t{width:100%;border-collapse:collapse;font-size:10px}
    table.t th{background:#1e293b;color:#fff;padding:7px 6px;font-size:9px;text-align:center;letter-spacing:0.3px}
    table.t td{border:1px solid #e2e8f0;padding:5px 6px;text-align:center}
    table.t tr:hover td{background:#f8fafc}
    .total-row td{background:#fff7ed;font-weight:bold;border-top:2px solid #f97316}
    .margen-table td{border:1px solid #e2e8f0;padding:5px 8px;font-size:10px}
    .margen-table .val{font-weight:bold;text-align:right}
    .foot{margin-top:30px;padding-top:12px;border-top:2px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:8px;line-height:1.6}
    .foot strong{color:#64748b}
    @media print{body{font-size:10px}.no-print{display:none}}
    .badge{display:inline-block;background:#fef3c7;color:#92400e;font-size:8px;padding:2px 6px;border-radius:4px;font-weight:bold}
  </style></head><body>
  
  <div class="header">
    <div class="logo"><img src="/logo.png" alt="WM" /></div>
    <div class="empresa-info">
      <h1>${EMPRESA.nombre}</h1>
      <div class="slogan">“${EMPRESA.eslogan}”</div>
      <div class="datos">${EMPRESA.direccion || 'Guatemala'} · ${EMPRESA.telefono ? 'Tel: ' + EMPRESA.telefono : ''} ${EMPRESA.email ? '· ' + EMPRESA.email : ''}</div>
    </div>
    <div class="doc-ref">
      <div class="tit">PRESUPUESTO</div>
      <div class="subt">${fecha}</div>
      <div class="subt" style="margin-top: 4px"><span class="badge">Versi&oacute;n 1.0</span></div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="label">Proyecto</span><span class="value">${proyecto}</span></div>
    <div class="meta-item"><span class="label">Tipolog&iacute;a</span><span class="value">${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia}</span></div>
    <div class="meta-item"><span class="label">Renglones</span><span class="value">${renglones.length}</span></div>
    <div class="meta-item"><span class="label">Moneda</span><span class="value">Quetzales (GTQ)</span></div>
    <div class="meta-item"><span class="label">Herramienta Menor</span><span class="value">${(HERRAMIENTA_MENOR * 100).toFixed(0)}%</span></div>
  </div>

  <div class="section">
    <div class="section-title">📋 Resumen de Renglones</div>
    <table class="t">
      <thead><tr><th>#</th><th>C&oacute;digo</th><th style="text-align:left">Descripci&oacute;n</th><th>Unidad</th><th>Cant.</th><th>C. Directo</th><th>P. Unitario</th><th>TOTAL</th></tr></thead>
      <tbody>${filas}<tr class="total-row"><td colspan="7" style="text-align:right">TOTAL DEL PRESUPUESTO</td><td style="text-align:right">${fmtQ(gran)}</td></tr></tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">📊 Desglose de M&aacute;rgenes</div>
    <table class="t" style="width:auto;min-width:400px">
      <thead><tr><th style="text-align:left">Concepto</th><th>%</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>
        <tr><td style="text-align:left">Costo Directo Total</td><td>—</td><td class="val">${fmtQ(granDir)}</td></tr>
        <tr><td style="text-align:left">Costos Indirectos</td><td>${(COSTOS_INDIRECTOS * 100).toFixed(0)}%</td><td class="val">${fmtQ(indirectos)}</td></tr>
        <tr><td style="text-align:left">Administraci&oacute;n</td><td>${(ADMINISTRACION * 100).toFixed(0)}%</td><td class="val">${fmtQ(administracion)}</td></tr>
        <tr><td style="text-align:left">Imprevistos</td><td>${(IMPREVISTOS * 100).toFixed(0)}%</td><td class="val">${fmtQ(imprevistos)}</td></tr>
        <tr><td style="text-align:left">Utilidad</td><td>${(UTILIDAD * 100).toFixed(0)}%</td><td class="val">${fmtQ(utilidad)}</td></tr>
        <tr class="total-row"><td style="text-align:left;font-weight:bold">TOTAL PRESUPUESTO</td><td></td><td class="val" style="font-size:13px">${fmtQ(gran)}</td></tr>
      </tbody>
    </table>
  </div>

  ${resumenMatHTML}

  <div class="section">
    <div class="section-title">🔧 Desglose Unitario de Materiales (APU)</div>
    ${desglose}
  </div>

  ${firmaHTML}

  <div class="foot">
    <strong>${EMPRESA.nombre}</strong> — ${EMPRESA.eslogan}<br>
    ${EMPRESA.direccion || 'Guatemala'} ${EMPRESA.telefono ? '· Tel: ' + EMPRESA.telefono : ''} ${EMPRESA.email ? '· ' + EMPRESA.email : ''}<br>
    Documento generado por el ERP CONSTRUSMART &mdash; Los precios est&aacute;n sujetos a variaci&oacute;n del mercado.<br>
    Precios V&aacute;lidos por 30 d&iacute;as a partir de la fecha de emisi&oacute;n.
  </div>

  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
};