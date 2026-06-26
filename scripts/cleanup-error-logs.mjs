import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupErrorLogs(daysToKeep = 90) {
  try {
    console.log(`Starting cleanup of error logs older than ${daysToKeep} days...`);

    const { data, error } = await supabase.rpc('cleanup_old_error_logs', {
      days_to_keep: daysToKeep
    });

    if (error) {
      console.error('Error during cleanup:', error);
      process.exit(1);
    }

    const deletedCount = data || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} error logs deleted`);
    console.log(`   Kept logs from the last ${daysToKeep} days`);
    
    return deletedCount;
  } catch (err) {
    console.error('Exception during cleanup:', err);
    process.exit(1);
  }
}

const daysToKeep = parseInt(process.argv[2]) || 90;

cleanupErrorLogs(daysToKeep)
  .then(count => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
