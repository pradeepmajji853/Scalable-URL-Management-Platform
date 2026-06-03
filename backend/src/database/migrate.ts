import { pool, query } from './connection';
import logger from '../configs/logger';

interface Migration {
  name: string;
  up: string;
  down: string;
}

const migrations: Migration[] = [];

// Dynamically load all migration files in order
async function loadMigrations(): Promise<void> {
  const migrationFiles = [
    { name: '001_create_users', module: require('./migrations/001_create_users') },
    { name: '002_create_urls', module: require('./migrations/002_create_urls') },
    { name: '003_create_url_clicks', module: require('./migrations/003_create_url_clicks') },
    { name: '004_create_teams', module: require('./migrations/004_create_teams') },
    { name: '005_create_api_keys', module: require('./migrations/005_create_api_keys') },
    { name: '006_create_refresh_tokens', module: require('./migrations/006_create_refresh_tokens') },
    { name: '007_create_audit_logs', module: require('./migrations/007_create_audit_logs') },
  ];

  migrations.length = 0;
  for (const file of migrationFiles) {
    migrations.push({
      name: file.name,
      up: file.module.up,
      down: file.module.down,
    });
  }
}

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  const result = await query<{ name: string }>('SELECT name FROM _migrations ORDER BY id ASC');
  return result.rows.map((row) => row.name);
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  await loadMigrations();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const pending = migrations.filter((m) => !applied.includes(m.name));

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return;
  }

  logger.info(`Found ${pending.length} pending migration(s)`);

  for (const migration of pending) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      logger.info(`Running migration: ${migration.name}`);
      await client.query(migration.up);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [migration.name]);
      await client.query('COMMIT');
      logger.info(`Migration applied: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${migration.name}`, { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info('All migrations applied successfully');
}

/**
 * Roll back the last migration
 */
async function rollbackMigration(): Promise<void> {
  await loadMigrations();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const lastApplied = applied[applied.length - 1];
  const migration = migrations.find((m) => m.name === lastApplied);
  if (!migration) {
    throw new Error(`Migration file not found for: ${lastApplied}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.info(`Rolling back migration: ${migration.name}`);
    await client.query(migration.down);
    await client.query('DELETE FROM _migrations WHERE name = $1', [migration.name]);
    await client.query('COMMIT');
    logger.info(`Migration rolled back: ${migration.name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Rollback failed: ${migration.name}`, { error: (error as Error).message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Roll back all migrations
 */
async function rollbackAll(): Promise<void> {
  await loadMigrations();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  // Rollback in reverse order
  for (let i = applied.length - 1; i >= 0; i--) {
    const migrationName = applied[i];
    const migration = migrations.find((m) => m.name === migrationName);
    if (!migration) {
      logger.warn(`Migration file not found for: ${migrationName}, skipping`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      logger.info(`Rolling back migration: ${migration.name}`);
      await client.query(migration.down);
      await client.query('DELETE FROM _migrations WHERE name = $1', [migration.name]);
      await client.query('COMMIT');
      logger.info(`Migration rolled back: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Rollback failed: ${migration.name}`, { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info('All migrations rolled back successfully');
}

// CLI execution
async function main(): Promise<void> {
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigration();
        break;
      case 'reset':
        await rollbackAll();
        break;
      case 'redo':
        await rollbackMigration();
        await runMigrations();
        break;
      case 'status': {
        await ensureMigrationsTable();
        const applied = await getAppliedMigrations();
        await loadMigrations();
        console.log('\nMigration Status:');
        console.log('─'.repeat(50));
        for (const m of migrations) {
          const status = applied.includes(m.name) ? '✓ Applied' : '✗ Pending';
          console.log(`  ${status}  ${m.name}`);
        }
        console.log('');
        break;
      }
      default:
        console.log('Usage: tsx src/database/migrate.ts [up|down|reset|redo|status]');
    }
  } catch (error) {
    logger.error('Migration command failed', { error: (error as Error).message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runMigrations, rollbackMigration, rollbackAll };
