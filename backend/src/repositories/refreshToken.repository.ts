import { query } from '../database/connection';
import { RefreshToken } from '../types';

export class RefreshTokenRepository {
  async create(data: {
    user_id: string;
    token_hash: string;
    user_agent?: string;
    ip_address?: string;
    expires_at: Date;
  }): Promise<RefreshToken> {
    const result = await query<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.user_id, data.token_hash, data.user_agent || null, data.ip_address || null, data.expires_at]
    );
    return result.rows[0];
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await query<RefreshToken>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rowCount ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    return result.rowCount ?? 0;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const result = await query<RefreshToken>(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
