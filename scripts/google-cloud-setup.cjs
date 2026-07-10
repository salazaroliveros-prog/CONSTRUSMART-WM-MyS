const { chromium } = require('playwright');

const GOOGLE_CLIENT_ID = '173954740912-8ln9635hlu86t991j19qdn4mkn9jvuhp.apps.googleusercontent.com';

const URLS_TO_ADD = {
  origins: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://construsmart-wm2026.vercel.app',
    'https://construsmart-wm2026-proyectoswm.vercel.app',
    'https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app',
    'https://construsmart.vercel.app',
  ],
  redirects: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://construsmart-wm2026.vercel.app',
    'https://construsmart-wm2026-proyectoswm.vercel.app',
    'https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app',
    'https://construsmart.vercel.app',
  ],
};

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Google Cloud Console Setup ===');
  console.log('1. Navegando a Google Cloud Console...');
  await page.goto('https://console.cloud.google.com/apis/credentials?project=erp-constructora-wm', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  console.log('2. Navegador abierto. Inicia sesión en Google si es necesario.');
  console.log('   Luego navega a: APIs & Services > Credentials');
  console.log('   Haz clic en el OAuth 2.0 Client ID:');
  console.log('   ' + GOOGLE_CLIENT_ID);
  console.log('');
  console.log('=== URLs que DEBES AGREGAR ===');
  console.log('');
  console.log('Authorized JavaScript Origins:');
  URLS_TO_ADD.origins.forEach(u => console.log('  ' + u));
  console.log('');
  console.log('Authorized Redirect URIs:');
  URLS_TO_ADD.redirects.forEach(u => console.log('  ' + u));
  console.log('');
  console.log('3. Después de agregar las URLs, haz clic en SAVE.');
  console.log('4. Cierra la ventana del navegador cuando termines.');
  console.log('');
  console.log('Esperando hasta 5 minutos...');

  try {
    await page.waitForTimeout(300000);
  } catch (e) {
    console.log('Navegador cerrado por el usuario.');
  }

  try {
    await browser.close();
  } catch (e) {}
  console.log('Script finalizado.');
})();