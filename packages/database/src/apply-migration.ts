import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



async function main() {
  // Use Supabase transaction pooler — resolves to IPv4 (direct DB host is IPv6-only from WSL)
  console.log('Connecting to database via IPv4 transaction pooler...');
  const sql = postgres({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    username: 'postgres.ppzvuzubblkmabvslzuh',
    password: 'Toptenprom2026',
    ssl: 'require',
    max: 1,
  });

  // Read the migration file
  const migrationPath = resolve(__dirname, '../migrations/0001_freezing_dorian_gray.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split on drizzle statement-breakpoint markers and filter empty statements
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    console.log(`  [${i + 1}/${statements.length}] ${stmt.slice(0, 80).replace(/\n/g, ' ')}...`);
    try {
      await sql.unsafe(stmt);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      // Skip "already exists" errors gracefully
      if (
        e?.message?.includes('already exists') ||
        e?.code === '42P07' ||
        e?.code === '42710'
      ) {
        console.log(`    -> Already exists, skipping.`);
      } else {
        console.error(`    -> FAILED: ${e?.message}`);
        throw err;
      }
    }
  }

  console.log('\nMigration applied successfully.');
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
