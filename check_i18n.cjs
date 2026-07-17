const es = require('./src/lib/i18n/es.json');
const en = require('./src/lib/i18n/en.json');

const namespaces = ['RRHH', 'Calidad', 'conflicts', 'admin'];
for (const ns of namespaces) {
  if (es[ns] && en[ns]) {
    console.log('--- ' + ns + ' ---');
    console.log('es keys:', Object.keys(es[ns]).length);
    console.log('en keys:', Object.keys(en[ns]).length);
    for (const [k, v] of Object.entries(es[ns])) {
      if (typeof v === 'string') {
        const enVal = en[ns][k];
        if (enVal === undefined) {
          console.log('  MISSING: ' + ns + '.' + k);
        } else if (v === enVal) {
          console.log('  SPANISH VAL: ' + ns + '.' + k + ' = "' + v.substring(0, 80) + '"');
        }
      }
      if (typeof v === 'object' && v !== null) {
        for (const [k2, v2] of Object.entries(v)) {
          if (typeof v2 === 'string') {
            const enVal = en[ns]?.[k]?.[k2];
            if (enVal === undefined) {
              console.log('  MISSING: ' + ns + '.' + k + '.' + k2);
            } else if (v2 === enVal) {
              console.log('  SPANISH VAL: ' + ns + '.' + k + '.' + k2 + ' = "' + v2.substring(0, 80) + '"');
            }
          }
        }
      }
    }
  } else {
    console.log(ns + ': missing from ' + (es[ns] ? 'en' : 'es'));
  }
}
