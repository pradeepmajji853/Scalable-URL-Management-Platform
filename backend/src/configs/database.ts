import { Pool, PoolConfig, QueryResult, QueryResultRow, PoolClient } from 'pg';
import config from './index';
import logger from './logger';

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  min: config.database.poolMin,
  max: config.database.poolMax,
  idleTimeoutMillis: config.database.idleTimeoutMs,
  connectionTimeoutMillis: config.database.connectionTimeoutMs,
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Execute a parameterized query against the pool
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 */
export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  let released = false;

  client.release = () => {
    if (released) return;
    released = true;
    originalRelease();
  };

  (client as any).queryWithLogging = async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - start;
      logger.debug('Transaction query', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      return result as QueryResult<T>;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Transaction query error', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        error: (error as Error).message,
      });
      throw error;
    }
  };

  return client;
}

/**
 * Execute a function within a database transaction
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database connectivity
 */
export async function healthCheck(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latencyMs: Date.now() - start };
  }
}

/**
 * Gracefully shut down the pool
 */
export async function shutdown(): Promise<void> {
  logger.info('Shutting down database pool...');
  await pool.end();
  logger.info('Database pool shut down successfully');
}

export { pool };
export default pool;
