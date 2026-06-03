import { pool, query } from './connection';
import { hashPassword, generateShortCode } from '../utils/helpers';
import logger from '../configs/logger';

async function seed(): Promise<void> {
  logger.info('Starting database seeding...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if test user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@linkly.app']
    );

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      logger.info('Test user already exists, skipping user creation');
    } else {
      // Create test user
      const passwordHash = await hashPassword('Test@123456');
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, is_verified, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['test@linkly.app', passwordHash, 'Test User', true, 'user']
      );
      userId = userResult.rows[0].id;
      logger.info('Test user created', { userId, email: 'test@linkly.app' });
    }

    // Create admin user
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@linkly.app']
    );

    if (existingAdmin.rows.length === 0) {
      const adminPasswordHash = await hashPassword('Admin@123456');
      const adminResult = await client.query(
        `INSERT INTO users (email, password_hash, name, is_verified, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['admin@linkly.app', adminPasswordHash, 'Admin User', true, 'admin']
      );
      logger.info('Admin user created', { userId: adminResult.rows[0].id, email: 'admin@linkly.app' });
    } else {
      logger.info('Admin user already exists, skipping');
    }

    // Create sample URLs
    const sampleUrls = [
      {
        original_url: 'https://github.com',
        short_code: generateShortCode(),
        title: 'GitHub',
        description: 'Where the world builds software',
      },
      {
        original_url: 'https://stackoverflow.com',
        short_code: generateShortCode(),
        title: 'Stack Overflow',
        description: 'The largest developer community',
      },
      {
        original_url: 'https://developer.mozilla.org',
        short_code: generateShortCode(),
        title: 'MDN Web Docs',
        description: 'Resources for developers, by developers',
      },
      {
        original_url: 'https://www.typescriptlang.org',
        short_code: generateShortCode(),
        title: 'TypeScript',
        description: 'TypeScript is JavaScript with syntax for types',
      },
      {
        original_url: 'https://nodejs.org',
        short_code: generateShortCode(),
        title: 'Node.js',
        description: 'Node.js JavaScript runtime',
      },
    ];

    for (const url of sampleUrls) {
      // Check if short_code already exists (unlikely but safe)
      const existing = await client.query(
        'SELECT id FROM urls WHERE short_code = $1',
        [url.short_code]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO urls (user_id, original_url, short_code, title, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, url.original_url, url.short_code, url.title, url.description]
        );
        logger.info(`Sample URL created: ${url.title} → ${url.short_code}`);
      }
    }

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed', { error: (error as Error).message });
    throw error;
  } finally {
    client.release();
  }
}

// CLI execution
async function main(): Promise<void> {
  try {
    await seed();
  } catch (error) {
    logger.error('Seed command failed', { error: (error as Error).message });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

export { seed };
