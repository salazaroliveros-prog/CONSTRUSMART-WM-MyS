const fs = require('fs');
const path = require('path');

const screensDir = path.join(process.cwd(), 'src', 'erp', 'screens');
const targets = ['Ajustes.tsx','Financiero.tsx','MuroObra.tsx','Notificaciones.tsx'];

let updated = 0;

for (const file of targets) {
  const filePath = path.join(screensDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${file}: no encontrado`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  content = content.replace(/(<h[123][^>]*>)([^<]*?)(<\/h[123]>)/g, (match, open, text, close) => {
    const tag = close.match(/<\/(h[123])>/)[1];
    const safeTitle = text.replace(/"/g, '"').trim();
    if (!safeTitle) return match;
    return `${open} truncate" title="${safeTitle}">${text}</${tag}>`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    updated++;
    console.log(`✅ ${file}`);
  } else {
    console.log(`ℹ️ ${file}: sin cambios`);
  }
}

console.log(`\nTotal actualizados: ${updated}/${targets.length}`);