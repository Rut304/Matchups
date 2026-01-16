import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check for command line arguments
const args = process.argv.slice(2);
const useLocal = args.includes('--local') || args.includes('-l');
const useRemote = args.includes('--remote') || args.includes('-r');

let connectionString: string;

if (useLocal) {
  // Local Supabase database
  connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  console.log('🏠 Using LOCAL Supabase database\n');
} else if (useRemote || process.env.DATABASE_URL) {
  // Remote Supabase database
  connectionString = process.env.DATABASE_URL!;
  if (!connectionString) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    
    if (!supabaseUrl || !dbPassword) {
      console.error('❌ Missing database connection info for remote database.');
      console.error('   Please set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local');
      console.error('');
      console.error('   💡 To run against local database instead, use: --local');
      console.error('');
      console.error('   You can find your database password in:');
      console.error('   Supabase Dashboard → Project Settings → Database → Connection String');
      process.exit(1);
    }
    
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  }
  console.log('☁️  Using REMOTE Supabase database\n');
} else {
  // Default to local
  connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  console.log('🏠 Using LOCAL Supabase database (default)\n');
  console.log('   💡 Use --remote to target production database\n');
}

async function runSQL() {
  console.log('🚀 Running 20-Year Historical Data SQL...\n');
  
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../supabase/historical-data-20years.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the entire SQL file as a single transaction
    console.log('📝 Executing SQL file...\n');
    
    await client.query('BEGIN');
    
    try {
      await client.query(sqlContent);
      await client.query('COMMIT');
      console.log('✅ SQL executed successfully!\n');
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    }
    
    // Verify the data
    console.log('📊 Verifying data...\n');
    
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM public.system_performance_summary'),
      client.query('SELECT COUNT(*) FROM public.historical_trends'),
      client.query('SELECT COUNT(*) FROM public.historical_prediction_markets'),
      client.query('SELECT COUNT(*) FROM public.historical_games'),
      client.query('SELECT COUNT(*) FROM public.historical_edge_picks'),
    ]);
    
    console.log('📈 Table row counts:');
    console.log(`   system_performance_summary: ${counts[0].rows[0].count} rows`);
    console.log(`   historical_trends: ${counts[1].rows[0].count} rows`);
    console.log(`   historical_prediction_markets: ${counts[2].rows[0].count} rows`);
    console.log(`   historical_games: ${counts[3].rows[0].count} rows`);
    console.log(`   historical_edge_picks: ${counts[4].rows[0].count} rows`);
    
    client.release();
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint) console.error('   Hint:', err.hint);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 20-Year historical data import complete!');
}

runSQL().catch(console.error);
