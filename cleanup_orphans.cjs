const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');

(async () => {
  await client.connect();
  console.log('Connected');

  const confirmedOrphans = [
    'final_dept_count', 'final_muni_count', 'logs_sistema',
    'cuadro_comparativo_proveedores', 'amortizaciones', 'anticipos',
    'cajas_chicas', 'centros_costo', 'pagos_proveedores', 'recepciones_almacen'
  ];

  const logs = [];

  for (const tbl of confirmedOrphans) {
    try {
      const check = await client.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists`,
        [tbl]
      );
      if (check.rows[0].exists) {
        await client.query(`DROP TABLE IF EXISTS public."${tbl}" CASCADE;`);
        logs.push(`[OK] DROP TABLE public."${tbl}"`);
      } else {
        logs.push(`[SKIP] public."${tbl}" not found`);
      }
    } catch (e) {
      logs.push(`[ERR] public."${tbl}": ${e.message}`);
    }
  }

  fs.writeFileSync(path.join('tmp', 'cleanup_orphans.log'), logs.join('\n'));
  console.log(logs.join('\n'));

  await client.end();
  console.log('Done');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
