import { readFileSync } from 'fs';
import { join } from 'path';
import { query, closePool } from './pool';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  try {
    console.log('[Migration] Iniciando migraciones...');

    const schemaPath = join(__dirname, 'migrations', '001_schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await query(statement + ';');
        console.log(`[Migration] Executed: ${statement.substring(0, 50)}...`);
      } catch (err: any) {
        // Ignore "already exists" errors for idempotency
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log(`[Migration] Skipped (already exists): ${statement.substring(0, 50)}...`);
      }
    }

    console.log('[Migration] Migraciones completadas exitosamente');
    await closePool();
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Error:', err);
    await closePool();
    process.exit(1);
  }
}

runMigrations();
