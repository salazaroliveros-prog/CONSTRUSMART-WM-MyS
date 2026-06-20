const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function repararMigraciones() {
  const reverted = ['20260102', '20260806001', '20260806002'];
  const applied = [
    '000000000009', '000000000013', '000000000014', '000000000015', '000000000016', 
    '000000000017', '000000000018', '000000000019', '000000000020', '000000000021',
    '000000000022', '000000000023', '000000000024', '000000000025', '000000000026',
    '000000000027', '000000000028', '000000000029', '000000000030', '000000000031',
    '000000000032', '000000000033', '000000000034', '000000000035', '000000000036',
    '000000000037', '000000000038', '000000000039', '000000000040', '000000000041',
    '000000000042', '000000000043'
  ];

  console.log('Reparando migraciones reverted...');
  for (const migration of reverted) {
    try {
      const cmd = `npx supabase migration repair --status reverted ${migration}`;
      await execAsync(cmd);
      console.log(`✅ ${migration}: reverted`);
    } catch (error) {
      console.log(`⚠️  ${migration}: ${error.message}`);
    }
  }

  console.log('\nReparando migraciones applied...');
  for (const migration of applied) {
    try {
      const cmd = `npx supabase migration repair --status applied ${migration}`;
      await execAsync(cmd);
      console.log(`✅ ${migration}: applied`);
    } catch (error) {
      console.log(`⚠️  ${migration}: ${error.message}`);
    }
  }

  console.log('\n=== Verificando estado final ===');
  try {
    await execAsync('npx supabase migration list');
  } catch (error) {
    console.log('Error verificando migraciones:', error.message);
  }
}

repararMigraciones()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });