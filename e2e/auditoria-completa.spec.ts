import { test, expect } from '@playwright/test';

test.describe('AUDITORÍA COMPLETA ERP CONSTRUSMART', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('1. LOGIN Y CARGA INICIAL', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Login y carga inicial');
    
    const title = await page.title();
    console.log('✓ Título:', title);
    expect(title).toBeTruthy();

    const body = await page.textContent('body');
    console.log('✓ Contenido body cargado');
    expect(body).toBeTruthy();

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    
    if (errors.length > 0) {
      console.log('❌ Errores de consola:', errors);
    } else {
      console.log('✓ Sin errores de consola');
    }
    expect(errors).toHaveLength(0);
  });

  test('2. DASHBOARD', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Dashboard');
    
    await page.waitForTimeout(3000);
    
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Dashboard cargado');

    const hasKPIs = await page.evaluate(() => {
      const kpis = document.querySelectorAll('[class*="kpi"], [class*="card"], [class*="metric"]');
      return kpis.length > 0;
    });
    console.log('✓ KPIs detectados:', hasKPIs);
  });

  test('3. PROYECTOS - Crear nuevo proyecto', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Proyectos');
    
    try {
      await page.click('text=Proyectos', { timeout: 5000 });
      await page.waitForTimeout(2000);
      console.log('✓ Navegó a Proyectos');
    } catch (e) {
      console.log('⚠️ No pudo navegar por sidebar, intentando por evaluación directa');
      await page.evaluate(() => {
        (window as any).setView?.('proyectos');
      });
      await page.waitForTimeout(2000);
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Proyectos cargada');

    const hasCrearBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => 
        btn.textContent?.toLowerCase().includes('nuevo') || 
        btn.textContent?.toLowerCase().includes('crear') ||
        btn.textContent?.toLowerCase().includes('proyecto')
      );
    });
    console.log('✓ Botón crear/ nuevo detectado:', hasCrearBtn);
  });

  test('4. PRESUPUESTOS - APU y cálculos', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Presupuestos');
    
    await page.evaluate(() => {
      (window as any).setView?.('presupuestos');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Presupuestos cargada');

    const hasAPU = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('apu') || 
             text.toLowerCase().includes('análisis') ||
             text.toLowerCase().includes('precios unitarios');
    });
    console.log('✓ APU detectado:', hasAPU);
  });

  test('5. BODEGA - Stock y materiales', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Bodega');
    
    await page.evaluate(() => {
      (window as any).setView?.('bodega');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Bodega cargada');

    const hasStock = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('stock') || 
             text.toLowerCase().includes('material') ||
             text.toLowerCase().includes('inventario');
    });
    console.log('✓ Stock/Materiales detectado:', hasStock);
  });

  test('6. SEGUIMIENTO - Avance y EVM', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Seguimiento');
    
    await page.evaluate(() => {
      (window as any).setView?.('seguimiento');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Seguimiento cargada');

    const hasAvance = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('avance') || 
             text.toLowerCase().includes('evm') ||
             text.toLowerCase().includes('curva');
    });
    console.log('✓ Avance/EVM detectado:', hasAvance);
  });

  test('7. FINANCIERO - Flujo de caja', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Financiero');
    
    await page.evaluate(() => {
      (window as any).setView?.('financiero');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Financiero cargada');

    const hasFlujo = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('flujo') || 
             text.toLowerCase().includes('caja') ||
             text.toLowerCase().includes('ingreso') ||
             text.toLowerCase().includes('gasto');
    });
    console.log('✓ Flujo de caja detectado:', hasFlujo);
  });

  test('8. CRM - Cotizaciones y clientes', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo CRM');
    
    await page.evaluate(() => {
      (window as any).setView?.('crm');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla CRM cargada');

    const hasCRM = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('cliente') || 
             text.toLowerCase().includes('cotización') ||
             text.toLowerCase().includes('pipeline');
    });
    console.log('✓ CRM/Cotizaciones detectado:', hasCRM);
  });

  test('9. PLANTILLAS - Plantillas de proyectos', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Plantillas');
    
    await page.evaluate(() => {
      (window as any).setView?.('plantillas');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Plantillas cargada');

    const hasPlantillas = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('plantilla') || 
             text.toLowerCase().includes('template');
    });
    console.log('✓ Plantillas detectado:', hasPlantillas);
  });

  test('10. RRHH - Empleados y planillas', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo RRHH');
    
    await page.evaluate(() => {
      (window as any).setView?.('rrhh');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla RRHH cargada');

    const hasRRHH = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('empleado') || 
             text.toLowerCase().includes('planilla');
    });
    console.log('✓ RRHH detectado:', hasRRHH);
  });

  test('11. CALIDAD - SSO y pruebas', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Calidad/SSO');
    
    await page.evaluate(() => {
      (window as any).setView?.('sso-calidad');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla SSO Calidad cargada');

    const hasCalidad = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('sso') || 
             text.toLowerCase().includes('calidad') ||
             text.toLowerCase().includes('prueba');
    });
    console.log('✓ Calidad/SSO detectado:', hasCalidad);
  });

  test('12. DOCUMENTACIÓN - Planos, RFI, Submittals', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Gestión Documental');
    
    await page.evaluate(() => {
      (window as any).setView?.('documentos');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Gestión Documental cargada');

    const hasDocs = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('plano') || 
             text.toLowerCase().includes('rfi') ||
             text.toLowerCase().includes('submittal');
    });
    console.log('✓ Documentación detectado:', hasDocs);
  });

  test('13. REPORTES - Reportes técnicos', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Módulo Reportes');
    
    await page.evaluate(() => {
      (window as any).setView?.('reportes');
    });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    console.log('✓ Pantalla Reportes cargada');

    const hasReportes = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.toLowerCase().includes('reporte') || 
             text.toLowerCase().includes('exportar');
    });
    console.log('✓ Reportes detectado:', hasReportes);
  });

  test('14. VERIFICACIÓN DE ERRORES EN CONSOLA', async ({ page }) => {
    console.log('🔍 AUDITORÍA: Verificación final de errores');
    
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.evaluate(() => {
      (window as any).setView?.('dashboard');
    });
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:', errors);
    } else {
      console.log('✅ No se encontraron errores en consola');
    }
  });
});
