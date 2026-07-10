import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FileInfo {
  path: string;
  name: string;
  ext: string;
  size: number;
  modified: Date;
  directory: string;
}

interface ImportInfo {
  from: string;
  line: number;
  file: string;
  resolved?: string;
  exists: boolean;
}

interface AuditResult {
  realDuplicates: Array<{
    name: string;
    files: FileInfo[];
  }>;
  brokenImports: ImportInfo[];
  actualFileUsage: Map<string, number>;
  deadCode: string[];
  recommendations: string[];
}

const CONSTRUSMART_ROOT = path.resolve(__dirname, '../../../..');
const EXCLUDE_DIRS = [
  'node_modules',
  '.kilo',
  '.git',
  'dist',
  'dist-debug',
  'build',
  'coverage',
  '.next',
  'out',
  'test-results',
  '_archive',
  'archive',
  'repo-github',
  '.vercel',
  '.playwright-mcp',
  '.github',
  'e2e'
];

function getAllFiles(dir: string, baseDir: string = dir): FileInfo[] {
  const files: FileInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (item.isDirectory()) {
        if (EXCLUDE_DIRS.includes(item.name)) {
          continue;
        }
        files.push(...getAllFiles(fullPath, baseDir));
      } else if (item.isFile()) {
        const ext = path.extname(item.name);
        const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'].includes(ext);
        
        if (isCodeFile) {
          try {
            const stats = fs.statSync(fullPath);
            files.push({
              path: fullPath,
              name: item.name,
              ext,
              size: stats.size,
              modified: stats.mtime,
              directory: path.dirname(relativePath)
            });
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (e) {
    // Skip directories that can't be read
  }
  
  return files;
}

function resolveImportPath(importPath: string, fromFile: string, rootDir: string): string | null {
  let resolved: string | null = null;
  
  if (importPath.startsWith('@/')) {
    const internalPath = importPath.replace('@/', 'src/');
    resolved = path.resolve(rootDir, internalPath);
  } else if (importPath.startsWith('.') || importPath.startsWith('..')) {
    resolved = path.resolve(path.dirname(fromFile), importPath);
  } else {
    // External package - return as-is
    return importPath;
  }
  
  // Try different extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
  for (const ext of extensions) {
    const testPath = ext ? resolved + ext : resolved;
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }
  
  // Try index files
  for (const ext of extensions) {
    const indexPath = path.join(resolved || '', `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

function extractImports(filePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  
  if (!fs.existsSync(filePath)) {
    return imports;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const importPatterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /export\s+.*?from\s+['"]([^'"]+)['"]/g,
      /require\(['"]([^'"]+)['"]\)/g
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of importPatterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex
        while ((match = pattern.exec(line)) !== null) {
          const importPath = match[1];
          const resolved = resolveImportPath(importPath, filePath, CONSTRUSMART_ROOT);
          const exists = resolved !== null && fs.existsSync(resolved);
          
          imports.push({
            from: importPath,
            line: i + 1,
            file: filePath,
            resolved: resolved || undefined,
            exists
          });
        }
      }
    }
  } catch (e) {
    // Skip files that can't be read
  }
  
  return imports;
}

function findRealDuplicates(files: FileInfo[]): Array<{ name: string; files: FileInfo[] }> {
  const nameMap = new Map<string, FileInfo[]>();
  
  for (const file of files) {
    // Only consider files in the same directory or similar structure
    const key = file.name.toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(file);
  }
  
  const duplicates: Array<{ name: string; files: FileInfo[] }> = [];
  
  for (const [name, fileGroup] of nameMap) {
    if (fileGroup.length > 1) {
      // Filter out obvious duplicates like index.ts in different directories
      const uniqueDirs = new Set(fileGroup.map(f => f.directory));
      if (uniqueDirs.size > 1) {
        duplicates.push({
          name,
          files: fileGroup.sort((a, b) => b.modified.getTime() - a.modified.getTime())
        });
      }
    }
  }
  
  return duplicates;
}

function analyzeFileUsage(files: FileInfo[], allImports: ImportInfo[]): Map<string, number> {
  const usageCount = new Map<string, number>();
  
  // Initialize all files with 0
  for (const file of files) {
    usageCount.set(file.path, 0);
  }
  
  // Count imports
  for (const imp of allImports) {
    if (imp.resolved && imp.exists) {
      const current = usageCount.get(imp.resolved) || 0;
      usageCount.set(imp.resolved, current + 1);
    }
  }
  
  return usageCount;
}

function findDeadCode(files: FileInfo[], usageCount: Map<string, number>): string[] {
  const dead: string[] = [];
  
  for (const file of files) {
    const count = usageCount.get(file.path) || 0;
    
    // Skip entry points and special files
    const isEntryPoint = 
      file.name === 'main.tsx' ||
      file.name === 'App.tsx' ||
      file.name === 'index.html' ||
      file.name === 'vite.config.ts' ||
      file.name.endsWith('.config.ts') ||
      file.name.endsWith('.config.js') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.css') ||
      file.name.endsWith('.md') ||
      file.directory.includes('supabase/functions') ||
      file.directory.includes('scripts');
    
    if (!isEntryPoint && count === 0) {
      dead.push(file.path);
    }
  }
  
  return dead;
}

function generateRecommendations(results: AuditResult): string[] {
  const recommendations: string[] = [];
  
  if (results.realDuplicates.length > 0) {
    recommendations.push(`⚠️ Se encontraron ${results.realDuplicates.length} archivos potencialmente duplicados. Revisar si alguno puede ser eliminado.`);
  }
  
  if (results.brokenImports.length > 0) {
    const criticalBroken = results.brokenImports.filter(imp => 
      !imp.from.startsWith('.') && !imp.from.startsWith('..') && !imp.from.startsWith('@/')
    );
    
    if (criticalBroken.length > 0) {
      recommendations.push(`🚨 Se encontraron ${criticalBroken.length} importaciones a paquetes externos que podrían no estar instalados. Verificar package.json.`);
    }
  }
  
  if (results.deadCode.length > 0) {
    recommendations.push(`🗑️ Se encontraron ${results.deadCode.length} archivos posiblemente no utilizados. Revisar manualmente antes de eliminar.`);
  }
  
  return recommendations;
}

function generateReport(results: AuditResult): string {
  let report = '# AUDITORÍA DE ARCHIVOS - CONSTRUSMART ERP (v2)\n';
  report += `Fecha: ${new Date().toISOString()}\n`;
  report += `Directorio analizado: ${CONSTRUSMART_ROOT}\n\n`;
  
  report += '## 1. ARCHIVOS DUPLICADOS REALES (mismo nombre, diferentes directorios)\n\n';
  if (results.realDuplicates.length === 0) {
    report += '✅ No se encontraron duplicados problemáticos.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.realDuplicates.length} grupos de archivos duplicados:\n\n`;
    for (const dup of results.realDuplicates) {
      report += `### ${dup.name}\n`;
      for (const file of dup.files) {
        const relPath = path.relative(CONSTRUSMART_ROOT, file.path);
        const dateStr = file.modified.toISOString().split('T')[0];
        report += `- ${relPath} (${dateStr}, ${file.size} bytes)\n`;
      }
      report += '\n';
    }
  }
  
  report += '## 2. IMPORTACIONES ROTAS (críticas)\n\n';
  const criticalBroken = results.brokenImports.filter(imp => 
    !imp.from.startsWith('.') && !imp.from.startsWith('..') && !imp.from.startsWith('@/') && !imp.exists
  );
  
  if (criticalBroken.length === 0) {
    report += '✅ No se encontraron importaciones críticas rotas.\n\n';
  } else {
    report += `🚨 Se encontraron ${criticalBroken.length} importaciones críticas rotas:\n\n`;
    for (const imp of criticalBroken.slice(0, 20)) {
      const relPath = path.relative(CONSTRUSMART_ROOT, imp.file);
      report += `- ${relPath}:${imp.line} → "${imp.from}"\n`;
    }
    if (criticalBroken.length > 20) {
      report += `... y ${criticalBroken.length - 20} más\n`;
    }
    report += '\n';
  }
  
  report += '## 3. ANÁLISIS DE USO DE ARCHIVOS\n\n';
  const mostUsed = Array.from(results.actualFileUsage.entries())
    .filter(([path, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  report += '### Archivos más utilizados:\n\n';
  for (const [filePath, count] of mostUsed) {
    const relPath = path.relative(CONSTRUSMART_ROOT, filePath);
    report += `- ${relPath}: ${count} importaciones\n`;
  }
  report += '\n';
  
  report += '## 4. CÓDIGO POSIBLEMENTE MUERTO\n\n';
  if (results.deadCode.length === 0) {
    report += '✅ No se detectó código muerto obvio.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.deadCode.length} archivos posiblemente no utilizados:\n\n`;
    for (const file of results.deadCode.slice(0, 30)) {
      const relPath = path.relative(CONSTRUSMART_ROOT, file);
      report += `- ${relPath}\n`;
    }
    if (results.deadCode.length > 30) {
      report += `... y ${results.deadCode.length - 30} más\n`;
    }
    report += '\n';
  }
  
  report += '## 5. RECOMENDACIONES\n\n';
  if (results.recommendations.length === 0) {
    report += '✅ No hay recomendaciones críticas.\n\n';
  } else {
    for (const rec of results.recommendations) {
      report += `${rec}\n`;
    }
    report += '\n';
  }
  
  return report;
}

async function main() {
  console.log('🔍 Iniciando auditoría de archivos v2...\n');
  
  console.log('📁 Escaneando archivos del proyecto CONSTRUSMART...');
  const files = getAllFiles(CONSTRUSMART_ROOT);
  console.log(`✅ Encontrados ${files.length} archivos de código\n`);
  
  console.log('🔍 Buscando duplicados reales...');
  const realDuplicates = findRealDuplicates(files);
  console.log(`✅ ${realDuplicates.length} duplicados encontrados\n`);
  
  console.log('📦 Analizando importaciones...');
  const allImports: ImportInfo[] = [];
  for (const file of files) {
    if (file.ext === '.ts' || file.ext === '.tsx' || file.ext === '.js' || file.ext === '.jsx') {
      const imports = extractImports(file.path);
      allImports.push(...imports);
    }
  }
  console.log(`✅ Analizadas ${allImports.length} importaciones\n`);
  
  console.log('⚠️ Buscando importaciones rotas...');
  const brokenImports = allImports.filter(imp => !imp.exists);
  console.log(`✅ ${brokenImports.length} importaciones rotas encontradas\n`);
  
  console.log('📊 Analizando uso de archivos...');
  const actualFileUsage = analyzeFileUsage(files, allImports);
  console.log(`✅ Análisis completado\n`);
  
  console.log('🗑️ Buscando código muerto...');
  const deadCode = findDeadCode(files, actualFileUsage);
  console.log(`✅ ${deadCode.length} archivos posiblemente muertos encontrados\n`);
  
  console.log('💡 Generando recomendaciones...');
  const recommendations = generateRecommendations({
    realDuplicates,
    brokenImports,
    actualFileUsage,
    deadCode,
    recommendations: []
  });
  console.log(`✅ ${recommendations.length} recomendaciones generadas\n`);
  
  const results: AuditResult = {
    realDuplicates,
    brokenImports,
    actualFileUsage,
    deadCode,
    recommendations
  };
  
  const report = generateReport(results);
  
  const reportPath = path.join(__dirname, '../../../../AUDITORIA_ARCHIVOS_V2.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`📊 Reporte generado: ${reportPath}\n`);
  console.log('='.repeat(60));
  console.log('RESUMEN:');
  console.log('='.repeat(60));
  console.log(`📁 Archivos analizados: ${files.length}`);
  console.log(`🔁 Duplicados reales: ${realDuplicates.length}`);
  console.log(`⚠️ Importaciones rotas: ${brokenImports.length}`);
  console.log(`📊 Archivos con uso: ${Array.from(actualFileUsage.values()).filter(c => c > 0).length}`);
  console.log(`🗑️ Código muerto: ${deadCode.length}`);
  console.log(`💡 Recomendaciones: ${recommendations.length}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
