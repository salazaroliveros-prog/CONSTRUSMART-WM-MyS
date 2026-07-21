const fs = require('fs');
const path = require('path');

const testDirs = ['src/__tests__', 'src/erp/__tests__', 'src/lib/__tests__'];
let skipped = 0;
const skippedDetails = [];

function walk(dir, depth = 0) {
  if (depth > 4) return;
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (f.endsWith('.test.ts') || f.endsWith('.test.tsx')) {
        const c = fs.readFileSync(full, 'utf8');
        const lines = c.split('\n');
        lines.forEach((line, idx) => {
          if (/\b(describe|test|it)\.skip\s*\(/.test(line)) {
            skipped++;
            skippedDetails.push({ file: full, line: idx + 1, match: line.trim() });
          }
        });
      } else if (fs.statSync(full).isDirectory()) {
        walk(full, depth + 1);
      }
    });
  } catch (e) { }
}

testDirs.forEach(d => walk(d));
console.log(JSON.stringify({ totalSkipped: skipped, details: skippedDetails }, null, 2));