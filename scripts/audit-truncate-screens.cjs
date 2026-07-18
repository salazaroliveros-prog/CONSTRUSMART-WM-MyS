const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '..', 'src', 'erp', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

const results = [];

for (const file of files) {
  const fullPath = path.join(screensDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  const hasTruncate = /truncate|line-clamp|overflow-hidden|text-ellipsis|break-words/.test(content);
  const hasTitle = content.includes('title=');
  const hasAntTable = /<Table|components\/Table|Table\s/.test(content) || /<Table/.test(content);

  let score = 0;
  if (!hasTruncate) score += 2; 
  if (!hasTitle) score += 1;

  results.push({ file, hasTruncate, hasTitle, hasAntTable, score });
}

results.sort((a,b) => b.score - a.score || a.file.localeCompare(b.file));

console.table(results.filter(r => r.score > 0 || r.hasTruncate === false));