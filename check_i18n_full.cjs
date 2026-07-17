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

const sameValues = Object.keys(esFlat).filter(k => enFlat[k] !== undefined && esFlat[k] === enFlat[k] && typeof esFlat[k] === 'string');
console.log('Keys with identical (Spanish) values:', sameValues.length);
for (const k of sameValues) {
  console.log(k + ' = "' + esFlat[k].substring(0, 100) + '"');
}
