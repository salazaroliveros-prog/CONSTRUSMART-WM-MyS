const fs = require('fs');
const path = require('path');

const screensDir = path.join(process.cwd(), 'src', 'erp', 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));
const missing = [];

for (const file of files) {
  const filePath = path.join(screensDir, file);
  const c = fs.readFileSync(filePath, 'utf8');
  if (!/ truncate"/.test(c)) missing.push(file);
}

console.log('Faltantes:', missing.length);
missing.forEach(x => console.log(' -', x));