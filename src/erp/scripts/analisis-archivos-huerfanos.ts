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
  isImported: boolean;
  importCount: number;
  importedBy: string[];
}

interface OrphanAnalysis {
  totalFiles: number;
  importedFiles: number;
  orphanFiles: FileInfo[];
  byCategory: {
    [category: string]: FileInfo[];
  };
  byDirectory: {
    [directory: string]: FileInfo[];
  };
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
  'e2e',
  '.vscode',
  '.devcontainer',
  'sessions',
  'logs',
  'screenshots',
  'reports',
  '1782675459890'
];

const ENTRY_POINTS = [
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vitest.config.ts',
  'playwright.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'eslint.config.js',
  'components.json',
  'vercel.json',
  '.env',
  '.env.example',
  '.env.local',
  '.env.production',
  '.gitignore',
  '.npmrc',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'CONTRIBUTING.md'
];

const CONFIG_PATTERNS = [
  /\.config\.(ts|js|json)$/,
  /\.rc$/,
  /^\.env/,
  /^\.gitignore$/,
  /^\.npmrc$/,
  /^package(-lock)?\.json$/,
  /^tsconfig.*\.json$/,
  /^vite\.config\.ts$/,
  /^tailwind\.config\.ts$/,
  /^postcss\.config\.js$/,
  /^eslint\.config\.js$/,
  /^playwright\.config\.ts$/,
  /^vitest\.config\.ts$/,
  /^components\.json$/,
  /^vercel\.json$/
];

const ASSET_PATTERNS = [
  /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\.(mp3|mp4|wav|ogg)$/,
  /\.manifest\.json$/,
  /^sw\.js$/,
  /^service-worker\.js$/
];

const DOC_PATTERNS = [
  /\.md$/,
  /\.txt$/,
  /\.rst$/,
  /^CHANGELOG$/,
  /^README$/,
  /^LICENSE$/,
  /^CONTRIBUTING$/
];

const TEST_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__/,
  /\.e2e\.(ts|tsx|js|jsx)$/,
  /\.cy\.(ts|tsx|js|jsx)$/
];

const SCRIPT_PATTERNS = [
  /^scripts\//,
  /\.cjs$/,
  /\.mjs$/,
  /\.sh$/,
  /\.bat$/,
  /\.ps1$/
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
        const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md'].includes(ext);
        
        if (isFileRelevant(item.name, relativePath)) {
          try {
            const stats = fs.statSync(fullPath);
            files.push({
              path: fullPath,
              name: item.name,
              ext,
              size: stats.size,
              modified: stats.mtime,
              directory: path.dirname(relativePath),
              isImported: false,
              importCount: 0,
              importedBy: []
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

function isFileRelevant(fileName: string, relativePath: string): boolean {
  // Excluir archivos de configuración (no se consideran huérfanos)
  if (CONFIG_PATTERNS.some(pattern => pattern.test(fileName))) {
    return false;
  }
  
  // Excluir assets (no se consideran huérfanos)
  if (ASSET_PATTERNS.some(pattern => pattern.test(fileName))) {
    return false;
  }
  
  // Excluir documentación (no se consideran huérfanos)
  if (DOC_PATTERNS.some(pattern => pattern.test(fileName))) {
    return false;
  }
  
  // Excluir tests (no se consideran huérfanos)
  if (TEST_PATTERNS.some(pattern => pattern.test(relativePath) || pattern.test(fileName))) {
    return false;
  }
  
  // Excluir scripts (no se consideran huérfanos)
  if (SCRIPT_PATTERNS.some(pattern => pattern.test(relativePath))) {
    return false;
  }
  
  // Excluir entry points
  if (ENTRY_POINTS.includes(relativePath) || ENTRY_POINTS.includes(fileName)) {
    return false;
  }
  
  // Solo considerar archivos de código
  const ext = path.extname(fileName);
  return ['.ts', '.tsx', '.js', '.jsx', '.css', '.html'].includes(ext);
}

function extractImports(filePath: string): string[] {
  const imports: string[] = [];
  
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
      /require\(['"]([^'"]+)['"]\)/g,
      /<script\s+src=['"]([^'"]+)['"]/g,
      /<link\s+[^>]*href=['"]([^'"]+)['"]/g
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of importPatterns) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(line)) !== null) {
          imports.push(match[1]);
        }
      }
    }
  } catch (e) {
    // Skip files that can't be read
  }
  
  return imports;
}

function resolveImportPath(importPath: string, fromFile: string, rootDir: string): string | null {
  let resolved: string | null = null;
  
  if (importPath.startsWith('@/')) {
    const internalPath = importPath.replace('@/', 'src/');
    resolved = path.resolve(rootDir, internalPath);
  } else if (importPath.startsWith('.') || importPath.startsWith('..')) {
    resolved = path.resolve(path.dirname(fromFile), importPath);
  } else if (importPath.startsWith('/')) {
    resolved = path.resolve(rootDir, importPath.substring(1));
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

function analyzeImports(files: FileInfo[]): Map<string, FileInfo> {
  const fileMap = new Map<string, FileInfo>();
  
  for (const file of files) {
    fileMap.set(file.path, file);
  }
  
  for (const file of files) {
    const imports = extractImports(file.path);
    
    for (const imp of imports) {
      const resolved = resolveImportPath(imp, file.path, CONSTRUSMART_ROOT);
      
      if (resolved && fileMap.has(resolved)) {
        const importedFile = fileMap.get(resolved)!;
        importedFile.isImported = true;
        importedFile.importCount++;
        importedFile.importedBy.push(file.path);
      }
    }
  }
  
  return fileMap;
}

function categorizeFile(file: FileInfo): string {
  const ext = file.ext;
  const dir = file.directory.toLowerCase();
  
  if (dir.includes('components')) {
    if (dir.includes('ui')) return 'UI Component';
    if (dir.includes('erp')) return 'ERP Component';
    return 'Component';
  }
  
  if (dir.includes('screens')) return 'Screen';
  if (dir.includes('hooks')) return 'Hook';
  if (dir.includes('lib')) return 'Library';
  if (dir.includes('utils')) return 'Utility';
  if (dir.includes('services')) return 'Service';
  if (dir.includes('store')) return 'Store';
  if (dir.includes('schemas')) return 'Schema';
  if (dir.includes('types')) return 'Type Definition';
  if (dir.includes('styles') || dir.includes('css')) return 'Style';
  if (dir.includes('assets') || dir.includes('public')) return 'Asset';
  if (dir.includes('scripts')) return 'Script';
  if (dir.includes('pages')) return 'Page';
  if (dir.includes('supabase')) return 'Supabase';
  if (dir.includes('tests') || dir.includes('__tests__')) return 'Test';
  
  if (ext === '.ts' || ext === '.tsx') return 'TypeScript';
  if (ext === '.js' || ext === '.jsx') return 'JavaScript';
  if (ext === '.css') return 'CSS';
  if (ext === '.html') return 'HTML';
  
  return 'Other';
}

function findOrphanFiles(fileMap: Map<string, FileInfo>): FileInfo[] {
  const orphans: FileInfo[] = [];
  
  for (const file of fileMap.values()) {
    if (!file.isImported && file.importCount === 0) {
      orphans.push(file);
    }
  }
  
  return orphans.sort((a, b) => b.size - a.size);
}

function generateReport(analysis: OrphanAnalysis): string {
  let report = '# ANÁLISIS DE ARCHIVOS HUÉRFANOS - CONSTRUSMART ERP\n';
  report += `Fecha: ${new Date().toISOString()}\n`;
  report += `Directorio analizado: ${CONSTRUSMART_ROOT}\n\n`;
  
  report += '## RESUMEN EJECUTIVO\n\n';
  report += `- **Total archivos analizados**: ${analysis.totalFiles}\n`;
  report += `- **Archivos importados**: ${analysis.importedFiles}\n`;
  report += `- **Archivos huérfanos**: ${analysis.orphanFiles.length}\n`;
  report += `- **Porcentaje huérfanos**: ${((analysis.orphanFiles.length / analysis.totalFiles) * 100).toFixed(2)}%\n\n`;
  
  if (analysis.orphanFiles.length === 0) {
    report += '✅ **No se encontraron archivos huérfanos.** Todos los archivos están conectados al proyecto.\n\n';
    return report;
  }
  
  report += '## ARCHIVOS HUÉRFANOS POR CATEGORÍA\n\n';
  
  for (const [category, files] of Object.entries(analysis.byCategory)) {
    if (files.length === 0) continue;
    
    report += `### ${category} (${files.length} archivos)\n\n`;
    
    for (const file of files) {
      const relPath = path.relative(CONSTRUSMART_ROOT, file.path);
      const dateStr = file.modified.toISOString().split('T')[0];
      const sizeKB = (file.size / 1024).toFixed(2);
      
      report += `- **${relPath}**\n`;
      report += `  - Tamaño: ${sizeKB} KB\n`;
      report += `  - Modificado: ${dateStr}\n`;
      report += `  - Directorio: ${file.directory}\n\n`;
    }
  }
  
  report += '## ARCHIVOS HUÉRFANOS POR DIRECTORIO\n\n';
  
  for (const [directory, files] of Object.entries(analysis.byDirectory)) {
    if (files.length === 0) continue;
    
    report += `### ${directory} (${files.length} archivos)\n\n`;
    
    for (const file of files) {
      const relPath = path.relative(CONSTRUSMART_ROOT, file.path);
      report += `- ${relPath}\n`;
    }
    report += '\n';
  }
  
  return report;
}

async function main() {
  console.log('🔍 Iniciando análisis de archivos huérfanos...\n');
  
  console.log('📁 Escaneando archivos del proyecto CONSTRUSMART...');
  const files = getAllFiles(CONSTRUSMART_ROOT);
  console.log(`✅ Encontrados ${files.length} archivos relevantes\n`);
  
  console.log('📦 Analizando importaciones...');
  const fileMap = analyzeImports(files);
  console.log(`✅ Análisis completado\n`);
  
  console.log('🔍 Buscando archivos huérfanos...');
  const orphanFiles = findOrphanFiles(fileMap);
  console.log(`✅ ${orphanFiles.length} archivos huérfanos encontrados\n`);
  
  console.log('📂 Clasificando archivos huérfanos...');
  const byCategory: { [category: string]: FileInfo[] } = {};
  const byDirectory: { [directory: string]: FileInfo[] } = {};
  
  for (const file of orphanFiles) {
    const category = categorizeFile(file);
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(file);
    
    const dir = file.directory;
    if (!byDirectory[dir]) {
      byDirectory[dir] = [];
    }
    byDirectory[dir].push(file);
  }
  
  const importedCount = files.length - orphanFiles.length;
  
  const analysis: OrphanAnalysis = {
    totalFiles: files.length,
    importedFiles: importedCount,
    orphanFiles,
    byCategory,
    byDirectory
  };
  
  const report = generateReport(analysis);
  
  const reportPath = path.join(__dirname, '../../../../ANALISIS_ARCHIVOS_HUERFANOS.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`📊 Reporte generado: ${reportPath}\n`);
  console.log('='.repeat(60));
  console.log('RESUMEN:');
  console.log('='.repeat(60));
  console.log(`📁 Archivos analizados: ${analysis.totalFiles}`);
  console.log(`✅ Archivos importados: ${analysis.importedFiles}`);
  console.log(`👻 Archivos huérfanos: ${analysis.orphanFiles.length}`);
  console.log(`📊 Porcentaje huérfanos: ${((analysis.orphanFiles.length / analysis.totalFiles) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
}

main().catch(console.error);
