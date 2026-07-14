SET PGPASSWORD=postgres
cd supabase
type migrations\0100_tier1_critical_fixes.sql | psql -h 127.0.0.1 -U postgres -d postgres -p 54322
