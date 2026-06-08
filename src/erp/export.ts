import { RenglonPresupuesto } from './types';
import { sanitizarTexto } from '@/lib/security';
import { EMPRESA, fmtQ, costoDirectoUnitario, precioUnitarioVenta, TIPOLOGIA_LABEL, COSTOS_INDIRECTOS, ADMINISTRACION, IMPREVISTOS, UTILIDAD, HERRAMIENTA_MENOR, downloadBlob, sanitizeCSV } from './utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const calcRow = (r: RenglonPresupuesto) => {
  const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
  const pv = precioUnitarioVenta(cd);
  return { cd, pv, total: pv * r.cantidad };
};

const getResumenMateriales = (renglones: RenglonPresupuesto[]) => {
  const materiales: Record<string, { unidad: string; cantidad: number; total: number }> = {};
  renglones.forEach(r => {
    if (r.subRenglones) {
      r.subRenglones.forEach(sub => {
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

const getMaterialesPorRenglon = (r: RenglonPresupuesto) => {
  if (!r.subRenglones || r.subRenglones.length === 0) return 0;
  return r.subRenglones.reduce((sum, sub) => sum + sub.cantidadUnitaria * r.cantidad, 0);
};

export const exportCSV = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string) => {
  const fecha = new Date().toLocaleDateString('es-GT');
  const rows: string[] = [];
  rows.push(sanitizeCSV(EMPRESA.nombre));
  rows.push(sanitizeCSV(`${EMPRESA.nombre} - ${EMPRESA.eslogan}`));
  rows.push(sanitizeCSV(EMPRESA.direccion || ''));
  rows.push(sanitizeCSV(`Tel: ${EMPRESA.telefono || ''} | Email: ${EMPRESA.email || ''}`));
  rows.push(sanitizeCSV(`Fecha: ${fecha}`));
  rows.push(`${sanitizeCSV(`Proyecto: ${proyecto}`)};${sanitizeCSV(`Tipologia: ${TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia}`)}`);
  rows.push('');
  rows.push('Codigo;Renglon;Unidad;Cantidad;Cant.Materiales;Materiales;Mano Obra;Equipo;Costo Directo;Precio Unitario;Total');
  let gran = 0;
  renglones.forEach(r => {
    const { cd, pv, total } = calcRow(r);
    const cantMat = getMaterialesPorRenglon(r);
    gran += total;
    rows.push(`${sanitizeCSV(r.codigo)};${sanitizeCSV(r.nombre)};${sanitizeCSV(r.unidad)};${r.cantidad};${cantMat.toFixed(2)};${r.costoMateriales.toFixed(2)};${r.costoManoObra.toFixed(2)};${r.costoEquipo.toFixed(2)};${cd.toFixed(2)};${pv.toFixed(2)};${total.toFixed(2)}`);
    if (r.subRenglones && r.subRenglones.length > 0) {
      r.subRenglones.forEach(sub => {
        const cantTotal = sub.cantidadUnitaria * r.cantidad;
        rows.push(`;Material:;${sanitizeCSV(sub.nombreMaterial)};${sub.cantidadUnitaria};${cantTotal.toFixed(2)};${sanitizeCSV(sub.unidad)};${sanitizeCSV(`Precio: Q${sub.precioUnitario.toFixed(2)}`)};${sanitizeCSV(`Total: Q${(cantTotal * sub.precioUnitario).toFixed(2)}`)};;;;`);
      });
      rows.push(`;Total materiales del renglón;;;;${cantMat.toFixed(2)};;;;;;;;`);
    }
    if (r.costoManoObra > 0) {
      const jornales = Math.round(r.costoManoObra / 350);
      rows.push(`;;[Personal cuadrilla];;;${jornales} persona(s);;;;;;;;;`);
    }
  });
  rows.push('');
  rows.push(`${''.repeat(10)}TOTAL;${gran.toFixed(2)}`);

  const materiales = getResumenMateriales(renglones);
  if (materiales.length > 0) {
    rows.push('');
    rows.push('=== RESUMEN DE MATERIALES ===');
    rows.push('Material;Cantidad;Unidad;Subtotal');
    let totalMateriales = 0;
    materiales.forEach(m => {
      totalMateriales += m.total;
      rows.push(`${sanitizeCSV(m.nombre)};${m.cantidad.toFixed(2)};${sanitizeCSV(m.unidad)};${m.total.toFixed(2)}`);
    });
    rows.push('');
    rows.push(`Total Materiales;;${totalMateriales.toFixed(2)}`);
  }

  const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `Presupuesto_${proyecto.replace(/\s+/g, '_')}.csv`);
};

function validarUrlImagen(url: string): boolean {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('data:image/') || url.startsWith('/');
}

export const exportPDF = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string, firma?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const proyectoSanitizado = sanitizarTexto(proyecto);
  const tipologiaSanitizada = sanitizarTexto(TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia);
  const empresaNombre = sanitizarTexto(EMPRESA.nombre);
  const empresaEslogan = sanitizarTexto(EMPRESA.eslogan);
  const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

  const ORANGE = [249, 115, 22] as const;
  const DARK = [15, 23, 42] as const;
  const GRAY = [100, 116, 139] as const;

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const fy = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(7);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      const footerText = `${empresaNombre} — ${empresaEslogan} | Pág. ${i} de ${pageCount} | ${fecha}`;
      const fw = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - fw) / 2, fy);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, fy - 2, pageWidth - margin, fy - 2);
    }
    doc.setPage(pageCount);
  };

  const checkPage = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 20) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(18);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text('PRESUPUESTO', margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text(`${empresaNombre} — ${empresaEslogan}`, margin, y);
  y += 4;
  doc.text(`Fecha: ${fecha}`, margin, y);
  y += 8;

  doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`Proyecto: ${proyectoSanitizado}`, margin, y);
  y += 5;
  doc.text(`Tipología: ${tipologiaSanitizada}`, margin, y);
  y += 5;
  doc.text(`Renglones: ${renglones.length}`, margin, y);
  y += 10;

  let gran = 0;
  let granDir = 0;
  const renglonBody = renglones.map((r, i) => {
    const { cd, pv, total } = calcRow(r);
    gran += total;
    granDir += cd * r.cantidad;
    const cantMat = getMaterialesPorRenglon(r);
    return [
      `${i + 1}`,
      r.codigo,
      r.nombre,
      r.unidad,
      r.cantidad.toString(),
      cantMat.toFixed(2),
      fmtQ(cd),
      fmtQ(pv),
      fmtQ(total),
    ];
  });

  checkPage(40);
  autoTable(doc, {
    startY: y,
    head: [['#', 'Código', 'Descripción', 'Ud.', 'Cant.', 'C.Mat.', 'C.Directo', 'P.Unit.', 'Total']],
    body: renglonBody,
    foot: [[{ content: 'TOTAL DEL PRESUPUESTO', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } }, fmtQ(gran)]],
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    footStyles: { fillColor: [255, 247, 237], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14 },
      2: { cellWidth: 55 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const indirectos = granDir * COSTOS_INDIRECTOS;
  const administracion = (granDir + indirectos) * ADMINISTRACION;
  const imprevistos = (granDir + indirectos + administracion) * IMPREVISTOS;
  const utilidad = (granDir + indirectos + administracion + imprevistos) * UTILIDAD;

  checkPage(40);
  doc.setFontSize(11);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text('Desglose de Márgenes', margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Concepto', '%', 'Monto']],
    body: [
      ['Costo Directo Total', '—', fmtQ(granDir)],
      ['Costos Indirectos', `${(COSTOS_INDIRECTOS * 100).toFixed(0)}%`, fmtQ(indirectos)],
      ['Administración', `${(ADMINISTRACION * 100).toFixed(0)}%`, fmtQ(administracion)],
      ['Imprevistos', `${(IMPREVISTOS * 100).toFixed(0)}%`, fmtQ(imprevistos)],
      ['Utilidad', `${(UTILIDAD * 100).toFixed(0)}%`, fmtQ(utilidad)],
    ],
    foot: [['TOTAL PRESUPUESTO', '', fmtQ(gran)]],
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    footStyles: { fillColor: [255, 247, 237], fontSize: 8, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const materiales = getResumenMateriales(renglones);
  if (materiales.length > 0) {
    let totalMat = 0;
    const matBody = materiales.map(m => {
      totalMat += m.total;
      return [m.nombre, m.cantidad.toFixed(2), m.unidad, fmtQ(m.total)];
    });

    checkPage(40);
    doc.setFontSize(11);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text('Resumen de Materiales', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Material', 'Cantidad', 'Unidad', 'Subtotal']],
      body: matBody,
      foot: [['TOTAL MATERIALES', '', '', fmtQ(totalMat)]],
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      footStyles: { fillColor: [255, 247, 237], fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  renglones.forEach(r => {
    const checkH = 40 + (r.subRenglones ? r.subRenglones.length * 8 : 0) + (r.insumos ? r.insumos.length * 6 : 0);
    checkPage(checkH);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${r.codigo} — ${r.nombre}`, margin, y);
    y += 4;

    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
    const pv = precioUnitarioVenta(cd);
    doc.text(`Costo Directo: ${fmtQ(cd)}  |  Precio Unitario: ${fmtQ(pv)}  |  Cantidad: ${r.cantidad} ${r.unidad}`, margin, y);
    y += 6;

    if (r.insumos && r.insumos.length > 0) {
      const insBody = r.insumos.map(s => [s.nombre, s.tipo, s.unidad, fmtQ(s.precio)]);
      autoTable(doc, {
        startY: y,
        head: [['Insumo', 'Tipo', 'Unidad', 'Precio']],
        body: insBody,
        theme: 'plain',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 20 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 20, halign: 'right' },
        },
        margin: { left: margin + 4, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    if (r.subRenglones && r.subRenglones.length > 0) {
      const subBody = r.subRenglones.map(s => {
        const costoTot = s.cantidadUnitaria * r.cantidad * s.precioUnitario;
        return [s.nombreMaterial, s.cantidadUnitaria.toString(), (s.cantidadUnitaria * r.cantidad).toFixed(2), s.unidad, fmtQ(s.precioUnitario), fmtQ(costoTot)];
      });
      const subTotal = r.subRenglones.reduce((a, s) => a + s.cantidadUnitaria * r.cantidad * s.precioUnitario, 0);

      autoTable(doc, {
        startY: y,
        head: [['Material', 'Cant/Unidad', 'Cant Total', 'Ud.', 'Precio Unit.', 'Costo Total']],
        body: subBody,
        foot: [[{ content: 'TOTAL MATERIALES', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, fmtQ(subTotal)]],
        theme: 'plain',
        headStyles: { fillColor: [240, 253, 244], textColor: [4, 120, 87], fontSize: 6, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6 },
        footStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 15, halign: 'right' },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 10, halign: 'center' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
        },
        margin: { left: margin + 8, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    }
  });

  if (firma && validarUrlImagen(firma)) {
    checkPage(30);
    y = Math.max(y, doc.internal.pageSize.getHeight() - 50);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('Firma del responsable:', margin, y);
    y += 4;
    try {
      doc.addImage(firma, 'PNG', margin, y, 40, 15);
      y += 20;
    } catch {
      y += 4;
    }
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Vo.Bo. Residente de Obra', margin, y);
    y += 8;
  }

  addFooter();
  doc.save(`Presupuesto_${proyecto.replace(/\s+/g, '_')}.pdf`);
};

export const exportXLSX = (renglones: RenglonPresupuesto[], proyecto: string, tipologia: string) => {
  const wb = XLSX.utils.book_new();
  const proyectoSanitizado = sanitizarTexto(proyecto);
  const tipologiaSanitizada = sanitizarTexto(TIPOLOGIA_LABEL[tipologia as keyof typeof TIPOLOGIA_LABEL] || tipologia);

  let gran = 0;
  let granDir = 0;
  const renglonRows = renglones.map(r => {
    const { cd, pv, total } = calcRow(r);
    gran += total;
    granDir += cd * r.cantidad;
    const cantMat = getMaterialesPorRenglon(r);
    return {
      'Código': r.codigo,
      'Renglón': r.nombre,
      'Unidad': r.unidad,
      'Cantidad': r.cantidad,
      'Cant. Materiales': cantMat,
      'Costo Materiales': r.costoMateriales,
      'Mano de Obra': r.costoManoObra,
      'Equipo': r.costoEquipo,
      'Costo Directo': cd,
      'Precio Unitario': pv,
      'Total': total,
    };
  });

  const wsRenglones = XLSX.utils.json_to_sheet(renglonRows);
  XLSX.utils.sheet_add_aoa(wsRenglones, [['TOTAL DEL PRESUPUESTO', '', '', '', '', '', '', '', '', '', gran]], { origin: -1 });
  const colWidths = [
    { wch: 10 }, { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
  ];
  wsRenglones['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsRenglones, 'Renglones');

  const indirectos = granDir * COSTOS_INDIRECTOS;
  const administracion = (granDir + indirectos) * ADMINISTRACION;
  const imprevistos = (granDir + indirectos + administracion) * IMPREVISTOS;
  const utilidad = (granDir + indirectos + administracion + imprevistos) * UTILIDAD;

  const margenRows = [
    { Concepto: 'Costo Directo Total', Porcentaje: '—', Monto: granDir },
    { Concepto: 'Costos Indirectos', Porcentaje: `${(COSTOS_INDIRECTOS * 100).toFixed(0)}%`, Monto: indirectos },
    { Concepto: 'Administración', Porcentaje: `${(ADMINISTRACION * 100).toFixed(0)}%`, Monto: administracion },
    { Concepto: 'Imprevistos', Porcentaje: `${(IMPREVISTOS * 100).toFixed(0)}%`, Monto: imprevistos },
    { Concepto: 'Utilidad', Porcentaje: `${(UTILIDAD * 100).toFixed(0)}%`, Monto: utilidad },
    { Concepto: 'TOTAL PRESUPUESTO', Porcentaje: '', Monto: gran },
  ];
  const wsMargenes = XLSX.utils.json_to_sheet(margenRows);
  wsMargenes['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsMargenes, 'Márgenes');

  const materiales = getResumenMateriales(renglones);
  if (materiales.length > 0) {
    let totalMat = 0;
    const matRows = materiales.map(m => {
      totalMat += m.total;
      return { Material: m.nombre, Cantidad: m.cantidad, Unidad: m.unidad, Subtotal: m.total };
    });
    matRows.push({ Material: 'TOTAL MATERIALES', Cantidad: 0, Unidad: '', Subtotal: totalMat });
    const wsMateriales = XLSX.utils.json_to_sheet(matRows);
    wsMateriales['!cols'] = [{ wch: 35 }, { wch: 14 }, { wch: 8 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsMateriales, 'Materiales');
  }

  const subData: any[] = [];
  renglones.forEach(r => {
    if (r.subRenglones && r.subRenglones.length > 0) {
      r.subRenglones.forEach(s => {
        const cantTotal = s.cantidadUnitaria * r.cantidad;
        const costoTot = cantTotal * s.precioUnitario;
        subData.push({
          'Renglón': `${r.codigo} — ${r.nombre}`,
          'Material': s.nombreMaterial,
          'Cant/Unidad': s.cantidadUnitaria,
          'Cant Total': cantTotal,
          'Unidad': s.unidad,
          'Precio Unit.': s.precioUnitario,
          'Costo Total': costoTot,
        });
      });
    }
  });
  if (subData.length > 0) {
    const wsSub = XLSX.utils.json_to_sheet(subData);
    wsSub['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsSub, 'Desglose Materiales');
  }

  const metaRows = [
    { '': 'Proyecto', _: proyectoSanitizado },
    { '': 'Tipología', _: tipologiaSanitizada },
    { '': 'Renglones', _: renglones.length },
    { '': 'Moneda', _: 'Quetzales (GTQ)' },
    { '': 'Herramienta Menor', _: `${(HERRAMIENTA_MENOR * 100).toFixed(0)}%` },
    { '': 'Fecha', _: new Date().toLocaleDateString('es-GT') },
  ];
  const wsMeta = XLSX.utils.json_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadatos');

  const filename = `Presupuesto_${proyecto.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export { validarUrlImagen as _validarUrlImagen };
