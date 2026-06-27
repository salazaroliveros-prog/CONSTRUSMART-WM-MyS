const fs = require('fs');
const p = 'c:/Users/wilso/Documents/APPS/ERP EMPRESARIAL CONSTRUSMART -WM FAMOUS/CONSTRUSMART/src/erp/screens/Dashboard.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Add supabase import
if (!c.includes("import { supabase } from '@/lib/supabase'")) {
  c = c.replace(
    "import { SkeletonDashboard } from '../../components/SkeletonScreens';",
    "import { SkeletonDashboard } from '../../components/SkeletonScreens';\nimport { supabase } from '@/lib/supabase';"
  );
}

// 2. Add integrity state + effect after dashRef line
const stateHook = "  const [integrityData, setIntegrityData] = useState<any>(null);";
const effectHook = "  useEffect(() => { supabase.rpc('check_daily_integrity').then(({ data }) => data && setIntegrityData(data)).catch(() => {}); }, []);";
if (!c.includes(stateHook)) {
  c = c.replace("const dashRef = useRef<HTMLDivElement>(null);", "const dashRef = useRef<HTMLDivElement>(null);\n" + stateHook + "\n" + effectHook);
}

// 3. Add totalOrphans + totalNulls after hasData
if (!c.includes('const totalOrphans =')) {
  c = c.replace(
    "const hasData = (proyectos || []).length > 0 || (movimientos || []).length > 0 || (materiales || []).length > 0;",
    "const hasData = (proyectos || []).length > 0 || (movimientos || []).length > 0 || (materiales || []).length > 0;\n  const totalOrphans = integrityData?.fk_orphans?.reduce?.((a, o) => a + o.count, 0) ?? 0;\n  const totalNulls = integrityData?.null_checks?.reduce?.((a, o) => a + o.count, 0) ?? 0;"
  );
}

// 4. Replace orphans count (line 713-714)
c = c.replace(
  "{t('dashboard.integridad_huerfanos', { count: 0 })}",
  "{t('dashboard.integridad_huerfanos', { count: totalOrphans })}"
);
c = c.replace(
  '<span className="text-success font-medium">0</span>',
  '<span className={totalOrphans > 0 ? \'text-destructive font-medium\' : \'text-success font-medium\'}>{totalOrphans}</span>'
);

// 5. Replace nulls count (line 717-718)
c = c.replace(
  "{t('dashboard.integridad_nulls', { count: 0 })}",
  "{t('dashboard.integridad_nulls', { count: totalNulls })}"
);
c = c.replace(
  '<span className="text-success font-medium">0</span>',
  '<span className={totalNulls > 0 ? \'text-destructive font-medium\' : \'text-success font-medium\'}>{totalNulls}</span>'
);

// 6. Fix accents in i18n keys (original files use Spanish accents)
c = c.replace(/dashboard\.integridad_huerfanos/g, "dashboard.integridad_huérfanos");
c = c.replace(/dashboard\.integridad_nulls/g, "dashboard.integridad_nulls");

fs.writeFileSync(p, c);
console.log('OK');
