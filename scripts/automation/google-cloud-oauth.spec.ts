import { test, expect } from '@playwright/test';

/**
 * Script de automatización para configurar Google Cloud Console OAuth 2.0
 * 
 * REQUISITOS:
 * - Credenciales de autenticación de Google Cloud
 * - Acceso al proyecto OAuth 2.0
 * - Client ID: 173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com
 * 
 * INSTRUCCIONES:
 * 1. El navegador se abrirá en Google Cloud Console
 * 2. Haz login manualmente
 * 3. Presiona ENTER en la terminal cuando estés listo
 * 4. El script continuará la automatización
 */

test.describe('Google Cloud Console OAuth Configuration', () => {
  const URLs = {
    console: 'https://console.cloud.google.com/apis/credentials',
    localOrigins: [
      'http://localhost:8080',
      'http://localhost:5173'
    ],
    productionOrigins: [
      'https://construsmart-wm2026.vercel.app',
      'https://construsmart-wm2026-proyectoswm.vercel.app',
      'https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app'
    ]
  };

  test('Configurar Authorized JavaScript Origins', async ({ page }) => {
    console.log('🔧 Iniciando configuración de Google Cloud Console OAuth...');
    
    // Navegar a Google Cloud Console
    await page.goto(URLs.console);
    
    // Esperar login manual con indicación visual
    console.log('⚠️ Por favor, inicia sesión en Google Cloud Console');
    console.log('⚠️ Presiona ENTER en la terminal cuando estés listo para continuar...');
    
    // Esperar a que la página cambie de URL (indicador de login exitoso)
    await page.waitForURL(/console\.cloud\.google\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000); // Tiempo adicional para que cargue completamente
    
    console.log('✅ Login detectado, continuando con la automatización...');
    
    // Buscar el OAuth 2.0 Client ID específico
    const clientId = '173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com';
    
    try {
      // Esperar a que la página cargue completamente
      await page.waitForLoadState('networkidle');
      
      // Buscar el client ID en la lista con timeout extendido
      console.log('🔍 Buscando Client ID en la lista...');
      await page.waitForSelector('text=' + clientId, { timeout: 60000 });
      
      // Click en el client ID
      await page.click('text=' + clientId);
      
      // Esperar que cargue la página de configuración
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Click en "Edit" o el botón de editar
      console.log('📝 Abriendo formulario de edición...');
      const editButton = page.locator('button').filter({ hasText: /Edit|Editar/ }).first();
      await editButton.click();
      
      // Esperar que cargue el formulario
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Configurar Authorized JavaScript Origins
      console.log('📝 Configurando Authorized JavaScript Origins...');
      
      // Buscar el campo de Authorized JavaScript Origins
      const originsField = page.locator('input[placeholder*="origin"], textarea[placeholder*="origin"]').first();
      
      // Obtener valores actuales
      const currentOrigins = await originsField.inputValue();
      const allOrigins = [...URLs.localOrigins, ...URLs.productionOrigins];
      
      // Agregar URLs que no están ya configuradas
      const newOrigins = allOrigins.filter(url => !currentOrigins.includes(url));
      
      if (newOrigins.length > 0) {
        const updatedOrigins = currentOrigins ? `${currentOrigins}\n${newOrigins.join('\n')}` : newOrigins.join('\n');
        await originsField.fill(updatedOrigins);
        console.log('✅ Authorized JavaScript Origins actualizados:', newOrigins);
      } else {
        console.log('✅ Authorized JavaScript Origins ya están configurados');
      }
      
      // Configurar Authorized Redirect URIs
      console.log('📝 Configurando Authorized Redirect URIs...');
      
      const redirectField = page.locator('input[placeholder*="redirect"], textarea[placeholder*="redirect"]').first();
      const currentRedirects = await redirectField.inputValue();
      
      const newRedirects = allOrigins.filter(url => !currentRedirects.includes(url));
      
      if (newRedirects.length > 0) {
        const updatedRedirects = currentRedirects ? `${currentRedirects}\n${newRedirects.join('\n')}` : newRedirects.join('\n');
        await redirectField.fill(updatedRedirects);
        console.log('✅ Authorized Redirect URIs actualizados:', newRedirects);
      } else {
        console.log('✅ Authorized Redirect URIs ya están configurados');
      }
      
      // Guardar cambios
      console.log('💾 Guardando cambios...');
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
      await saveButton.click();
      
      // Esperar confirmación
      await page.waitForTimeout(3000);
      
      console.log('✅ Configuración de Google Cloud Console completada exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error);
      console.log('💡 Sugerencia: Verifica que estás en la página correcta y que el Client ID existe');
      throw error;
    }
  });

  test('Verificar configuración OAuth', async ({ page }) => {
    console.log('🔧 Verificando configuración OAuth...');
    
    await page.goto(URLs.console);
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Google Cloud Console');
    await page.waitForURL(/console\.cloud\.google\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Login detectado, verificando configuración...');
    
    // Verificar que el client ID existe
    const clientId = '173954740912-tn6iib9i3179ulv1mn81j3tmarh2ouf4.apps.googleusercontent.com';
    await expect(page.locator('text=' + clientId)).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Client ID verificado en Google Cloud Console');
  });
});
