const fs = require('fs');
const path = require('path');
const es = require('./src/lib/i18n/es.json');
const en = require('./src/lib/i18n/en.json');

function flatten(obj, prefix='') {
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

const esFlat = flatten(es);
const enFlat = flatten(en);
const allKeys = new Set([...Object.keys(esFlat), ...Object.keys(enFlat)]);

// Find all t('...') calls in src
function findTFiles(dir) {
  const results = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory() && !f.name.startsWith('.') && f.name !== 'node_modules' && f.name !== 'dist') {
      results.push(...findTFiles(fp));
    } else if (f.isFile() && (f.name.endsWith('.tsx') || f.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fp, 'utf-8');
      // Find t('key') or t("key")
      const matches = content.matchAll(/t\(['\"]([^'\"]+)['\"]/g);
      for (const m of matches) {
        const key = m[1];
        if (!allKeys.has(key)) {
          results.push({ file: fp.substring(fp.indexOf('src')), key });
        }
      }
    }
  }
  return results;
}

const missing = findTFiles('./src');
console.log('Missing t() keys (referenced in code but not in es.json or en.json):');
for (const { file, key } of missing.sort((a, b) => a.key.localeCompare(b.key))) {
  console.log('  ' + key + ' -> ' + file);
}
console.log('Total: ' + missing.length);
