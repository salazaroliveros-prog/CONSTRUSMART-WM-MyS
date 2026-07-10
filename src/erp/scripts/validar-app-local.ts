import * as http from 'http';

interface RouteTest {
  path: string;
  name: string;
  status: number;
  accessible: boolean;
  error?: string;
}

const ROUTES_TO_TEST = [
  { path: '/', name: 'Login/Index' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/proyectos', name: 'Proyectos' },
  { path: '/presupuestos', name: 'Presupuestos' },
  { path: '/seguimiento', name: 'Seguimiento' },
  { path: '/financiero', name: 'Financiero' },
  { path: '/rrhh', name: 'RRHH' },
  { path: '/bodega', name: 'Bodega' },
  { path: '/crm', name: 'CRM' },
  { path: '/apu', name: 'APU Avanzado' },
  { path: '/baseprecios', name: 'Base Precios' },
  { path: '/muro', name: 'Muro Obra' },
  { path: '/ordenes-cambio', name: 'Ordenes Cambio' },
  { path: '/notificaciones', name: 'Notificaciones' },
  { path: '/sso-calidad', name: 'SSO Calidad' },
  { path: '/documentos', name: 'Gestión Documental' },
  { path: '/visor-bim', name: 'Visor BIM' },
  { path: '/predictivo', name: 'Dashboard Predictivo' },
  { path: '/exportacion', name: 'Exportación Inteligente' },
  { path: '/logistica', name: 'Logística Compras' },
  { path: '/rendimiento-campo', name: 'Rendimiento Campo' },
  { path: '/comercial-fin', name: 'Comercial Finanzas' },
  { path: '/admin-sistema', name: 'Administración' },
  { path: '/planilla-destajos', name: 'Planilla Destajos' },
  { path: '/impuestos', name: 'Impuestos' },
  { path: '/entradas-almacen', name: 'Entradas Almacén' },
  { path: '/ajustes', name: 'Ajustes' },
  { path: '/hitos', name: 'Hitos' },
  { path: '/riesgos', name: 'Riesgos' },
  { path: '/cuentas-cobrar', name: 'Cuentas Cobrar' },
  { path: '/cuentas-pagar', name: 'Cuentas Pagar' },
  { path: '/cotizaciones', name: 'Cotizaciones' },
  { path: '/plantillas', name: 'Plantillas' },
  { path: '/proveedor-analytics', name: 'Proveedor Analytics' },
  { path: '/error-log', name: 'Error Log' },
  { path: '/activos', name: 'Activos' },
  { path: '/cuadros', name: 'Cuadros' },
  { path: '/profitability', name: 'Profitability Analytics' },
  { path: '/weather', name: 'Weather' },
];

function testRoute(route: { path: string; name: string }): Promise<RouteTest> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: route.path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path: route.path,
          name: route.name,
          status: res.statusCode,
          accessible: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path: route.path,
        name: route.name,
        status: 0,
        accessible: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path: route.path,
        name: route.name,
        status: 0,
        accessible: false,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Iniciando validación de rutas en http://localhost:8080\n');
  console.log('='.repeat(60));

  const results: RouteTest[] = [];
  
  for (const route of ROUTES_TO_TEST) {
    const result = await testRoute(route);
    results.push(result);
    
    const icon = result.accessible ? '✅' : '❌';
    const status = result.status > 0 ? `${result.status}` : 'ERROR';
    const error = result.error ? ` (${result.error})` : '';
    
    console.log(`${icon} ${route.name.padEnd(25)} - ${status}${error}`);
  }

  console.log('='.repeat(60));
  
  const accessible = results.filter(r => r.accessible).length;
  const total = results.length;
  const percentage = ((accessible / total) * 100).toFixed(1);
  
  console.log(`\n📊 RESUMEN:`);
  console.log(`✅ Rutas accesibles: ${accessible}/${total} (${percentage}%)`);
  console.log(`❌ Rutas fallidas: ${total - accessible}/${total}`);
  
  if (accessible === total) {
    console.log('\n🎉 ¡Todas las rutas están funcionando correctamente!');
  } else {
    console.log('\n⚠️ Algunas rutas presentan problemas. Revisar los errores arriba.');
  }
}

main().catch(console.error);
