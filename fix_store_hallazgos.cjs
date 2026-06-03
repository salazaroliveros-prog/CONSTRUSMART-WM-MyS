const fs = require('fs');
let c = fs.readFileSync('src/erp/store.tsx', 'utf8');

// #11: Limite mutation queue - max 100 entradas
c = c.replace(
  "setMutationQueue(q => [...q, mutation]);",
  "setMutationQueue(q => {\n      if (q.length >= 100) q.shift();\n      return [...q, mutation];\n    });"
);

// #19: Usar VITE_ADMIN_EMAIL en lugar de hardcodear
c = c.replace(
  "if (email === 'salazaroliveros@gmail.com') return 'Administrador';",
  "const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim() || 'salazaroliveros@gmail.com';\n      if (email === adminEmail) return 'Administrador';"
);

// #22: Eliminar la variable dead code ADMIN_EMAIL que esta duplicada
c = c.replace(
  /const ADMIN_EMAIL = \(import\.meta\.env\.VITE_ADMIN_EMAIL.*?\n.*?\n/,
  ''
);

// #14: Agregar timeout a fetchInitialData via safeFrom - ya tiene try/catch pero no timeout
// Agregamos AbortController con 30s timeout
c = c.replace(
  "const safeFrom = async (table: string, query?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>) => {",
  "const safeFrom = async (table: string, query?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>) => {\n      const controller = new AbortController();\n      const timeout = setTimeout(() => controller.abort(), 30000);"
);
c = c.replace(
  "return data.map((row) => sanitizarObjeto(row));",
  "clearTimeout(timeout);\n        return data.map((row) => sanitizarObjeto(row));"
);
c = c.replace(
  "console.warn(`[Supabase] ${table} fetch failed:`, err);\n        return null;",
  "clearTimeout(timeout);\n        console.warn(`[Supabase] ${table} fetch failed:`, err);\n        return null;"
);

fs.writeFileSync('src/erp/store.tsx', c);
console.log('Done - store.tsx updated');