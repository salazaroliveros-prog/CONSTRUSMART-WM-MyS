const fs = require('fs');
const path = require('path');
const es = JSON.parse(fs.readFileSync('./src/lib/i18n/es.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('./src/lib/i18n/en.json', 'utf-8'));

function flatten(obj, prefix) {
  let result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flatten(v, key));
    } else {
      result[key] = v;
    }
  }
  return result;
}

const esFlat = flatten(es, '');
const enFlat = flatten(en, '');
const allDefined = new Set([...Object.keys(esFlat), ...Object.keys(enFlat)]);

function findSrcFiles(dir) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return []; }
  for (const f of entries) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (!f.name.startsWith('.') && f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '__tests__' && f.name !== '.git') {
        results.push(...findSrcFiles(fp));
      }
    } else if (f.isFile() && (f.name.endsWith('.tsx') || f.name.endsWith('.ts'))) {
      const rel = fp.replace(/\\/g, '/');
      if (rel.includes('__tests__') || rel.includes('scripts/') || rel.includes('.test.')) continue;
      results.push(fp);
    }
  }
  return results;
}

const screenFiles = findSrcFiles('./src');
console.log('Scanning ' + screenFiles.length + ' source files...');

const missingKeys = {};
for (const fp of screenFiles) {
  const content = fs.readFileSync(fp, 'utf-8');
  const matches = content.matchAll(/t\(['"](([a-z_]+\.)+[a-z_]+)['"]/g);
  for (const m of matches) {
    const key = m[1];
    if (!allDefined.has(key)) {
      const rel = fp.replace(/\\/g, '/');
      const idx = rel.indexOf('src');
      const short = idx >= 0 ? rel.substring(idx) : rel;
      if (!missingKeys[key]) missingKeys[key] = [];
      if (!missingKeys[key].includes(short)) missingKeys[key].push(short);
    }
  }
}

const sorted = Object.keys(missingKeys).sort();
console.log('\nMissing keys referenced in screens/components: ' + sorted.length);
for (const k of sorted) {
  console.log(k + ' -> ' + missingKeys[k].join(', '));
}
