import { test, expect } from '@playwright/test';

/**
 * Script de automatización para configurar Vercel Environment Variables
 * 
 * REQUISITOS:
 * - Credenciales de autenticación de Vercel
 * - Acceso al proyecto: proyectoswm/construsmart
 * - Project ID: prj_C62TqJl8LKFdzC2OAHKO6mwESTSJY
 */

test.describe('Vercel Environment Variables Configuration', () => {
  const URLs = {
    dashboard: 'https://vercel.com/proyectoswm/construsmart/settings/environment-variables',
    project: 'construsmart'
  };

  const environmentVariables = {
    'VITE_OPENWEATHER_API_KEY': '[CONFIGURADO]'
  };

  test('Configurar variable en ambiente Preview', async ({ page }) => {
    console.log('🔧 Iniciando configuración de Vercel Environment Variables...');
    
    // Navegar a Vercel Dashboard
    await page.goto(URLs.dashboard);
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Vercel Dashboard');
    console.log('⚠️ El script esperará 60 segundos para que completes el login...');
    await page.waitForTimeout(60000);
    
    try {
      // Click en "Add New" o botón similar
      console.log('📝 Agregando nueva variable de entorno...');
      
      const addButton = page.locator('button').filter({ hasText: /Add New|Add Variable/ }).first();
      await addButton.click();
      
      await page.waitForTimeout(2000);
      
      // Configurar nombre de la variable
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      await nameInput.fill('VITE_OPENWEATHER_API_KEY');
      console.log('✅ Nombre de variable configurado');
      
      // Configurar valor de la variable
      const valueInput = page.locator('input[name="value"], textarea[name="value"]').first();
      await valueInput.fill(environmentVariables['VITE_OPENWEATHER_API_KEY']);
      console.log('✅ Valor de variable configurado');
      
      // Seleccionar ambiente Preview
      const previewCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Preview/ }).first();
      if (!(await previewCheckbox.isChecked())) {
        await previewCheckbox.check();
        console.log('✅ Ambiente Preview seleccionado');
      }
      
      // Seleccionar ambiente Production
      const productionCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Production/ }).first();
      if (!(await productionCheckbox.isChecked())) {
        await productionCheckbox.check();
        console.log('✅ Ambiente Production seleccionado');
      }
      
      // Guardar cambios
      console.log('💾 Guardando variable de entorno...');
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
      await saveButton.click();
      
      await page.waitForTimeout(3000);
      console.log('✅ Variable de entorno guardada exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error);
      throw error;
    }
  });

  test('Verificar variables existentes', async ({ page }) => {
    console.log('🔧 Verificando variables de entorno existentes...');
    
    await page.goto(URLs.dashboard);
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Vercel Dashboard');
    await page.waitForTimeout(60000);
    
    try {
      // Lista de variables que deberían existir
      const expectedVariables = [
        'VITE_SUPABASE_KEY',
        'SUPABASE_DB_URL',
        'VITE_SUPABASE_SERVICE_ROLE_KEY',
        'VITE_ADMIN_EMAIL',
        'VITE_APP_ENV',
        'VITE_SUPABASE_URL',
        'VITE_OPENWEATHER_API_KEY'
      ];
      
      for (const varName of expectedVariables) {
        const variableElement = page.locator(`text=${varName}`).first();
        
        if (await variableElement.isVisible({ timeout: 5000 })) {
          console.log(`✅ ${varName}: Configurado`);
        } else {
          console.log(`⚠️ ${varName}: No encontrado`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error verificando variables:', error);
      throw error;
    }
  });

  test('Configuración completa de variables', async ({ page }) => {
    console.log('🔧 Ejecutando configuración completa de variables de entorno...');
    
    await page.goto(URLs.dashboard);
    
    // Esperar login manual
    console.log('⚠️ Por favor, inicia sesión en Vercel Dashboard');
    await page.waitForTimeout(60000);
    
    try {
      // Verificar si VITE_OPENWEATHER_API_KEY ya existe
      const existingVar = page.locator('text=VITE_OPENWEATHER_API_KEY').first();
      
      if (await existingVar.isVisible({ timeout: 5000 })) {
        console.log('✅ VITE_OPENWEATHER_API_KEY ya está configurado');
        
        // Verificar si está en Preview
        const varRow = existingVar.locator('..');
        const environments = await varRow.textContent();
        
        if (environments?.includes('Preview')) {
          console.log('✅ VITE_OPENWEATHER_API_KEY está configurado en Preview');
        } else {
          console.log('⚠️ VITE_OPENWEATHER_API_KEY no está en Preview, agregando...');
          
          // Click en editar
          const editButton = varRow.locator('button').filter({ hasText: /Edit|Editar/ }).first();
          await editButton.click();
          
          await page.waitForTimeout(2000);
          
          // Seleccionar Preview
          const previewCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Preview/ }).first();
          await previewCheckbox.check();
          
          // Guardar
          const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
          await saveButton.click();
          
          await page.waitForTimeout(2000);
          console.log('✅ VITE_OPENWEATHER_API_KEY agregado a Preview');
        }
      } else {
        console.log('📝 VITE_OPENWEATHER_API_KEY no existe, creando...');
        
        // Crear nueva variable
        const addButton = page.locator('button').filter({ hasText: /Add New|Add Variable/ }).first();
        await addButton.click();
        
        await page.waitForTimeout(2000);
        
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
        await nameInput.fill('VITE_OPENWEATHER_API_KEY');
        
        const valueInput = page.locator('input[name="value"], textarea[name="value"]').first();
        await valueInput.fill(environmentVariables['VITE_OPENWEATHER_API_KEY']);
        
        // Seleccionar Preview y Production
        const previewCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Preview/ }).first();
        await previewCheckbox.check();
        
        const productionCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Production/ }).first();
        await productionCheckbox.check();
        
        const saveButton = page.locator('button').filter({ hasText: /Save|Guardar/ }).first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
        console.log('✅ VITE_OPENWEATHER_API_KEY creado exitosamente');
      }
      
      console.log('✅ Configuración completa de variables finalizada');
      
    } catch (error) {
      console.error('❌ Error en configuración completa:', error);
      throw error;
    }
  });
});
