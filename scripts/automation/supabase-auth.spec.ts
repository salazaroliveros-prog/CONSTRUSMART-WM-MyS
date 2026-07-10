import { test, expect } from '@playwright/test';

/**
 * Script de automatización para configurar Supabase Authentication
 * 
 * REQUISITOS:
 * - Credenciales de autenticación de Supabase
 * - Acceso al proyecto: neygzluxugodiwcuctbj
 * - Google Provider ya configurado con credenciales
 * 
 * INSTRUCCIONES:
 * 1. El navegador se abrirá en Supabase Dashboard
 * 2. Haz login manualmente
 * 3. El script detectará el login automáticamente
 * 4. El script continuará la automatización
 */

test.describe('Supabase Authentication Configuration', () => {
  const URLs = {
    dashboard: 'https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/providers',
    siteURL: 'https://construsmart-wm2026.vercel.app',
    redirectURLs: [
      'http://localhost:8080',
      'http://localhost:5173',
      'https://construsmart-wm2026.vercel.app',
      'https://construsmart-wm2026-proyectoswm.vercel.app',
      'https://construsmart-wm2026-salazaroliveros-prog-proyectoswm.vercel.app'
    ]
  };

  test('Configurar Site URL', async ({ page }) => {
    console.log('🔧 Iniciando configuración de Supabase Authentication...');
    
    // Navegar a Supabase Dashboard
    await page.goto(URLs.dashboard);
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Supabase Dashboard');
    await page.waitForURL(/supabase\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Login detectado, continuando con la automatización...');
    
    try {
      // Navegar a URL Configuration
      await page.goto('https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/url-configuration');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Configurar Site URL
      console.log('📝 Configurando Site URL...');
      
      const siteURLInput = page.locator('input[name="siteUrl"], input[placeholder*="Site URL"]').first();
      await siteURLInput.fill(URLs.siteURL);
      console.log('✅ Site URL configurado:', URLs.siteURL);
      
      // Guardar cambios
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      console.log('✅ Site URL guardado exitosamente');
      
    } catch (error) {
      console.error('❌ Error configurando Site URL:', error);
      throw error;
    }
  });

  test('Configurar Redirect URLs', async ({ page }) => {
    console.log('🔧 Configurando Redirect URLs...');
    
    await page.goto('https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/url-configuration');
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Supabase Dashboard');
    await page.waitForURL(/supabase\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Login detectado, continuando con la automatización...');
    
    try {
      // Buscar campo de Redirect URLs
      console.log('📝 Configurando Redirect URLs...');
      
      const redirectInput = page.locator('textarea[name="redirectUrls"], textarea[placeholder*="Redirect"]').first();
      
      // Obtener valores actuales
      const currentURLs = await redirectInput.inputValue();
      
      // Agregar URLs que no están ya configuradas
      const newURLs = URLs.redirectURLs.filter(url => !currentURLs.includes(url));
      
      if (newURLs.length > 0) {
        const updatedURLs = currentURLs ? `${currentURLs}\n${newURLs.join('\n')}` : newURLs.join('\n');
        await redirectInput.fill(updatedURLs);
        console.log('✅ Redirect URLs actualizados:', newURLs);
      } else {
        console.log('✅ Redirect URLs ya están configurados');
      }
      
      // Guardar cambios
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      console.log('✅ Redirect URLs guardados exitosamente');
      
    } catch (error) {
      console.error('❌ Error configurando Redirect URLs:', error);
      throw error;
    }
  });

  test('Verificar Google Provider', async ({ page }) => {
    console.log('🔧 Verificando Google Provider...');
    
    await page.goto('https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/providers');
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Supabase Dashboard');
    await page.waitForURL(/supabase\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Login detectado, verificando Google Provider...');
    
    try {
      // Buscar Google Provider
      const googleProvider = page.locator('[data-provider="google"], [id*="google"]').first();
      
      // Verificar que esté visible
      await expect(googleProvider).toBeVisible();
      
      // Verificar que esté habilitado
      const enabledToggle = googleProvider.locator('input[type="checkbox"], [role="switch"]').first();
      const isEnabled = await enabledToggle.isChecked();
      
      if (isEnabled) {
        console.log('✅ Google Provider está habilitado');
      } else {
        console.log('⚠️ Google Provider no está habilitado, habilitando...');
        await enabledToggle.click();
        await page.waitForTimeout(2000);
        console.log('✅ Google Provider habilitado');
      }
      
      // Verificar credenciales
      const clientIdField = googleProvider.locator('input[name="clientId"], input[placeholder*="Client ID"]').first();
      const clientSecretField = googleProvider.locator('input[name="clientSecret"], input[placeholder*="Client Secret"]').first();
      
      const clientId = await clientIdField.inputValue();
      const clientSecret = await clientSecretField.inputValue();
      
      if (clientId && clientSecret) {
        console.log('✅ Google Provider tiene credenciales configuradas');
      } else {
        console.log('⚠️ Google Provider no tiene credenciales configuradas');
      }
      
    } catch (error) {
      console.error('❌ Error verificando Google Provider:', error);
      throw error;
    }
  });

  test('Configuración completa de Supabase Auth', async ({ page }) => {
    console.log('🔧 Ejecutando configuración completa de Supabase Auth...');
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Supabase Dashboard');
    await page.goto('https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/url-configuration');
    await page.waitForURL(/supabase\.com/, { timeout: 300000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Login detectado, ejecutando configuración completa...');
    
    try {
      // Configurar Site URL
      const siteURLInput = page.locator('input[name="siteUrl"], input[placeholder*="Site URL"]').first();
      await siteURLInput.fill(URLs.siteURL);
      console.log('✅ Site URL configurado');
      
      // Configurar Redirect URLs
      const redirectInput = page.locator('textarea[name="redirectUrls"], textarea[placeholder*="Redirect"]').first();
      const currentURLs = await redirectInput.inputValue();
      const newURLs = URLs.redirectURLs.filter(url => !currentURLs.includes(url));
      
      if (newURLs.length > 0) {
        const updatedURLs = currentURLs ? `${currentURLs}\n${newURLs.join('\n')}` : newURLs.join('\n');
        await redirectInput.fill(updatedURLs);
        console.log('✅ Redirect URLs actualizados');
      }
      
      // Guardar cambios
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar Google Provider
      await page.goto('https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/auth/providers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const googleProvider = page.locator('[data-provider="google"], [id*="google"]').first();
      const enabledToggle = googleProvider.locator('input[type="checkbox"], [role="switch"]').first();
      
      if (!(await enabledToggle.isChecked())) {
        await enabledToggle.click();
        await page.waitForTimeout(2000);
      }
      
      console.log('✅ Configuración completa de Supabase Auth finalizada');
      
    } catch (error) {
      console.error('❌ Error en configuración completa:', error);
      throw error;
    }
  });
});
