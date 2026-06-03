import { query } from '../database/connection';
import { APIKey } from '../types';

export class ApiKeyRepository {
  async create(data: {
    user_id: string;
    name: string;
    key_hash: string;
    key_prefix: string;
    scopes?: string[];
    expires_at?: string;
  }): Promise<APIKey> {
    const result = await query<APIKey>(
      `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.name,
        data.key_hash,
        data.key_prefix,
        data.scopes || ['urls:read', 'urls:write'],
        data.expires_at || null,
      ]
    );
    return result.rows[0];
  }

  async findByKeyHash(keyHash: string): Promise<APIKey | null> {
    const result = await query<APIKey>(
      `SELECT * FROM api_keys
       WHERE key_hash = $1
         AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [keyHash]
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<APIKey[]> {
    const result = await query<APIKey>(
      `SELECT id, user_id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findById(id: string): Promise<APIKey | null> {
    const result = await query<APIKey>(
      'SELECT * FROM api_keys WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async deactivate(id: string, userId: string): Promise<boolean> {
    const result = await query(
      'UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateLastUsed(id: string): Promise<void> {
    await query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [id]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM api_keys WHERE expires_at IS NOT NULL AND expires_at < NOW()'
    );
    return result.rowCount ?? 0;
  }
}

export const apiKeyRepository = new ApiKeyRepository();
