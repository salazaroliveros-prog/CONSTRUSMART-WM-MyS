const fs = require('fs');
let c = fs.readFileSync('src/erp/store.tsx', 'utf8');
c = c.replace('    const loadProfile = async', [
    '    const mapRol = (dbRol, email) => {',
    "      if (email === 'salazaroliveros@gmail.com') return 'Administrador';",
    "      if (dbRol === 'Administrador') return 'Gerente';",
    "      if (dbRol === 'usuario' || !dbRol) return 'Residente';",
    '      return dbRol;',
    '    };',
    '',
    '    const loadProfile = async'
  ].join('\n'));
fs.writeFileSync('src/erp/store.tsx', c);
console.log('Done');