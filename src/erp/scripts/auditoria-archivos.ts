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
}

interface AuditResult {
  duplicates: Array<{
    name: string;
    files: FileInfo[];
  }>;
  obsoleteImports: ImportInfo[];
  oldVsNew: Array<{
    name: string;
    old: FileInfo;
    new: FileInfo;
  }>;
  unusedFiles: string[];
  circularImports: string[][];
}

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const CONSTRUSMART_ROOT = path.join(PROJECT_ROOT, 'CONSTRUSMART');
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
  'archive',
  'repo-github'
];

const EXCLUDE_FILES = [
  '*.log',
  '*.map',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

function getAllFiles(dir: string, baseDir: string = dir): FileInfo[] {
  const files: FileInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

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
      const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'].includes(ext);
      
      if (isCodeFile) {
        const stats = fs.statSync(fullPath);
        files.push({
          path: fullPath,
          name: item.name,
          ext,
          size: stats.size,
          modified: stats.mtime,
          directory: path.dirname(relativePath)
        });
      }
    }
  }
  
  return files;
}

function findDuplicates(files: FileInfo[]): Array<{ name: string; files: FileInfo[] }> {
  const nameMap = new Map<string, FileInfo[]>();
  
  for (const file of files) {
    const key = file.name.toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(file);
  }
  
  const duplicates: Array<{ name: string; files: FileInfo[] }> = [];
  
  for (const [name, fileGroup] of nameMap) {
    if (fileGroup.length > 1) {
      duplicates.push({
        name,
        files: fileGroup.sort((a, b) => b.modified.getTime() - a.modified.getTime())
      });
    }
  }
  
  return duplicates.sort((a, b) => b.files.length - a.files.length);
}

function extractImports(filePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  
  if (!fs.existsSync(filePath)) {
    return imports;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const importPatterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /export\s+.*?from\s+['"]([^'"]+)['"]/g
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        imports.push({
          from: match[1],
          line: i + 1,
          file: filePath
        });
      }
    }
  }
  
  return imports;
}

function findObsoleteImports(files: FileInfo[], allImports: Map<string, ImportInfo[]>): ImportInfo[] {
  const obsolete: ImportInfo[] = [];
  const validPaths = new Set(files.map(f => f.path));
  const validNames = new Set(files.map(f => f.name.toLowerCase()));
  
  for (const [filePath, imports] of allImports) {
    for (const imp of imports) {
      const importPath = imp.from;
      let resolvedPath: string | null = null;
      
      if (importPath.startsWith('.')) {
        resolvedPath = path.resolve(path.dirname(filePath), importPath);
        
        let checkedPath = resolvedPath;
        if (!checkedPath.endsWith('.ts') && !checkedPath.endsWith('.tsx') && 
            !checkedPath.endsWith('.js') && !checkedPath.endsWith('.jsx')) {
          checkedPath += '.ts';
        }
        
        if (!fs.existsSync(checkedPath)) {
          const possibleIndex = path.join(resolvedPath, 'index.ts');
          const possibleIndexTsx = path.join(resolvedPath, 'index.tsx');
          
          if (!fs.existsSync(possibleIndex) && !fs.existsSync(possibleIndexTsx)) {
            obsolete.push(imp);
          }
        }
      } else if (importPath.startsWith('@/')) {
        const internalPath = importPath.replace('@/', 'src/');
        resolvedPath = path.resolve(CONSTRUSMART_ROOT, internalPath);
        
        let checkedPath = resolvedPath;
        if (!checkedPath.endsWith('.ts') && !checkedPath.endsWith('.tsx') && 
            !checkedPath.endsWith('.js') && !checkedPath.endsWith('.jsx')) {
          checkedPath += '.ts';
        }
        
        if (!fs.existsSync(checkedPath)) {
          const possibleIndex = path.join(resolvedPath, 'index.ts');
          const possibleIndexTsx = path.join(resolvedPath, 'index.tsx');
          
          if (!fs.existsSync(possibleIndex) && !fs.existsSync(possibleIndexTsx)) {
            obsolete.push(imp);
          }
        }
      } else if (importPath.startsWith('../') || importPath.startsWith('./')) {
        resolvedPath = path.resolve(path.dirname(filePath), importPath);
        
        if (!fs.existsSync(resolvedPath)) {
          obsolete.push(imp);
        }
      }
    }
  }
  
  return obsolete;
}

function findOldVsNew(files: FileInfo[]): Array<{ name: string; old: FileInfo; new: FileInfo }> {
  const comparisons: Array<{ name: string; old: FileInfo; new: FileInfo }> = [];
  const nameMap = new Map<string, FileInfo[]>();
  
  for (const file of files) {
    const key = file.name.toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(file);
  }
  
  for (const [name, fileGroup] of nameMap) {
    if (fileGroup.length === 2) {
      const sorted = fileGroup.sort((a, b) => b.modified.getTime() - a.modified.getTime());
      const [newer, older] = sorted;
      
      const timeDiff = newer.modified.getTime() - older.modified.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        comparisons.push({
          name,
          new: newer,
          old: older
        });
      }
    }
  }
  
  return comparisons.sort((a, b) => {
    const timeDiffA = b.new.modified.getTime() - a.new.modified.getTime();
    return timeDiffA;
  });
}

function findPotentialUnusedFiles(files: FileInfo[], allImports: Map<string, ImportInfo[]>): string[] {
  const importedFiles = new Set<string>();
  
  for (const imports of allImports.values()) {
    for (const imp of imports) {
      if (imp.from.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(imp.file), imp.from);
        importedFiles.add(resolvedPath);
      } else if (imp.from.startsWith('@/')) {
        const internalPath = imp.from.replace('@/', 'src/');
        const resolvedPath = path.resolve(CONSTRUSMART_ROOT, internalPath);
        importedFiles.add(resolvedPath);
      }
    }
  }
  
  const unused: string[] = [];
  
  for (const file of files) {
    if (!file.path.includes('node_modules') && 
        !file.path.includes('.kilo') &&
        !file.path.includes('dist') &&
        !file.path.includes('archive') &&
        !file.name.endsWith('.test.ts') &&
        !file.name.endsWith('.test.tsx') &&
        !file.name.endsWith('.spec.ts') &&
        !file.name.endsWith('.config.ts') &&
        !file.name.endsWith('.config.js') &&
        !file.name.endsWith('.json') &&
        !file.name.endsWith('.md')) {
      
      const isImported = Array.from(importedFiles).some(imp => 
        imp === file.path || 
        imp.startsWith(file.path) ||
        file.path.startsWith(imp)
      );
      
      if (!isImported) {
        unused.push(file.path);
      }
    }
  }
  
  return unused;
}

function analyzeCircularImports(files: FileInfo[]): string[][] {
  const circular: string[][] = [];
  const importMap = new Map<string, string[]>();
  
  for (const file of files) {
    if (file.ext === '.ts' || file.ext === '.tsx') {
      const imports = extractImports(file.path);
      const dependencies: string[] = [];
      
      for (const imp of imports) {
        if (imp.from.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(file.path), imp.from);
          dependencies.push(resolvedPath);
        }
      }
      
      importMap.set(file.path, dependencies);
    }
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function detectCycle(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    
    const dependencies = importMap.get(node) || [];
    
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        detectCycle(dep, [...path, dep]);
      } else if (recursionStack.has(dep)) {
        const cycleStart = path.indexOf(dep);
        if (cycleStart !== -1) {
          const cycle = [...path.slice(cycleStart), dep];
          circular.push(cycle);
        }
      }
    }
    
    recursionStack.delete(node);
  }
  
  for (const file of files) {
    if (!visited.has(file.path)) {
      detectCycle(file.path, [file.path]);
    }
  }
  
  return circular;
}

function generateReport(results: AuditResult): string {
  let report = '# AUDITORÍA DE ARCHIVOS - CONSTRUSMART ERP\n';
  report += `Fecha: ${new Date().toISOString()}\n\n`;
  
  report += '## 1. ARCHIVOS DUPLICADOS\n\n';
  if (results.duplicates.length === 0) {
    report += '✅ No se encontraron archivos duplicados.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.duplicates.length} grupos de archivos duplicados:\n\n`;
    for (const dup of results.duplicates) {
      report += `### ${dup.name} (${dup.files.length} archivos)\n`;
      for (const file of dup.files) {
        const relPath = path.relative(PROJECT_ROOT, file.path);
        const dateStr = file.modified.toISOString().split('T')[0];
        report += `- ${relPath} (${dateStr}, ${file.size} bytes)\n`;
      }
      report += '\n';
    }
  }
  
  report += '## 2. IMPORTACIONES A ARCHIVOS INEXISTENTES\n\n';
  if (results.obsoleteImports.length === 0) {
    report += '✅ No se encontraron importaciones a archivos inexistentes.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.obsoleteImports.length} importaciones problemáticas:\n\n`;
    for (const imp of results.obsoleteImports.slice(0, 50)) {
      const relPath = path.relative(PROJECT_ROOT, imp.file);
      report += `- ${relPath}:${imp.line} → "${imp.from}"\n`;
    }
    if (results.obsoleteImports.length > 50) {
      report += `... y ${results.obsoleteImports.length - 50} más\n`;
    }
    report += '\n';
  }
  
  report += '## 3. ARCHIVOS VIEJOS VS NUEVOS (más de 7 días de diferencia)\n\n';
  if (results.oldVsNew.length === 0) {
    report += '✅ No se encontraron archivos con versiones viejas significativamente desactualizadas.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.oldVsNew.length} archivos con versiones viejas:\n\n`;
    for (const comp of results.oldVsNew) {
      const oldRel = path.relative(PROJECT_ROOT, comp.old.path);
      const newRel = path.relative(PROJECT_ROOT, comp.new.path);
      const daysDiff = Math.round((comp.new.modified.getTime() - comp.old.modified.getTime()) / (1000 * 60 * 60 * 24));
      report += `### ${comp.name}\n`;
      report += `- **NUEVO**: ${newRel} (${comp.new.modified.toISOString().split('T')[0]})\n`;
      report += `- **VIEJO**: ${oldRel} (${comp.old.modified.toISOString().split('T')[0]})\n`;
      report += `- **Diferencia**: ${daysDiff} días\n\n`;
    }
  }
  
  report += '## 4. ARCHIVOS POSIBLEMENTE NO UTILIZADOS\n\n';
  if (results.unusedFiles.length === 0) {
    report += '✅ No se detectaron archivos claramente no utilizados.\n\n';
  } else {
    report += `⚠️ Se encontraron ${results.unusedFiles.length} archivos posiblemente no utilizados:\n\n`;
    for (const file of results.unusedFiles.slice(0, 30)) {
      const relPath = path.relative(PROJECT_ROOT, file);
      report += `- ${relPath}\n`;
    }
    if (results.unusedFiles.length > 30) {
      report += `... y ${results.unusedFiles.length - 30} más\n`;
    }
    report += '\n';
  }
  
  report += '## 5. IMPORTACIONES CIRCULARES\n\n';
  if (results.circularImports.length === 0) {
    report += '✅ No se detectaron importaciones circulares.\n\n';
  } else {
    report += `⚠️ Se detectaron ${results.circularImports.length} ciclos de importación:\n\n`;
    for (const cycle of results.circularImports) {
      report += '```\n';
      for (const file of cycle) {
        const relPath = path.relative(PROJECT_ROOT, file);
        report += `${relPath} →\n`;
      }
      report += '```\n\n';
    }
  }
  
  return report;
}

async function main() {
  console.log('🔍 Iniciando auditoría de archivos...\n');
  
  console.log('📁 Escaneando archivos del proyecto CONSTRUSMART...');
  const files = getAllFiles(CONSTRUSMART_ROOT);
  console.log(`✅ Encontrados ${files.length} archivos de código\n`);
  
  console.log('🔍 Buscando archivos duplicados...');
  const duplicates = findDuplicates(files);
  console.log(`✅ ${duplicates.length} grupos de duplicados encontrados\n`);
  
  console.log('📦 Analizando importaciones...');
  const allImports = new Map<string, ImportInfo[]>();
  for (const file of files) {
    if (file.ext === '.ts' || file.ext === '.tsx' || file.ext === '.js' || file.ext === '.jsx') {
      const imports = extractImports(file.path);
      if (imports.length > 0) {
        allImports.set(file.path, imports);
      }
    }
  }
  console.log(`✅ Analizadas ${allImports.size} archivos con importaciones\n`);
  
  console.log('⚠️ Buscando importaciones a archivos inexistentes...');
  const obsoleteImports = findObsoleteImports(files, allImports);
  console.log(`✅ ${obsoleteImports.length} importaciones problemáticas encontradas\n`);
  
  console.log('📅 Comparando versiones viejas vs nuevas...');
  const oldVsNew = findOldVsNew(files);
  console.log(`✅ ${oldVsNew.length} archivos con versiones viejas detectados\n`);
  
  console.log('🗑️ Buscando archivos posiblemente no utilizados...');
  const unusedFiles = findPotentialUnusedFiles(files, allImports);
  console.log(`✅ ${unusedFiles.length} archivos posiblemente no utilizados\n`);
  
  console.log('🔄 Detectando importaciones circulares...');
  const circularImports = analyzeCircularImports(files);
  console.log(`✅ ${circularImports.length} ciclos detectados\n`);
  
  const results: AuditResult = {
    duplicates,
    obsoleteImports,
    oldVsNew,
    unusedFiles,
    circularImports
  };
  
  const report = generateReport(results);
  
  const reportPath = path.join(__dirname, '../../../../AUDITORIA_ARCHIVOS.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Ruta absoluta del reporte: ${path.resolve(reportPath)}`);
  
  console.log(`📊 Reporte generado: ${reportPath}\n`);
  console.log('='.repeat(60));
  console.log('RESUMEN:');
  console.log('='.repeat(60));
  console.log(`📁 Archivos analizados: ${files.length}`);
  console.log(`🔁 Duplicados: ${duplicates.length}`);
  console.log(`⚠️ Importaciones rotas: ${obsoleteImports.length}`);
  console.log(`📅 Versiones viejas: ${oldVsNew.length}`);
  console.log(`🗑️ Posiblemente no usados: ${unusedFiles.length}`);
  console.log(`🔄 Ciclos circulares: ${circularImports.length}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
