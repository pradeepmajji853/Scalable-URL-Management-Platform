import { query } from '../database/connection';
import { User } from '../types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  async create(data: {
    email: string;
    password_hash: string;
    name: string;
    verification_token?: string;
  }): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (email, password_hash, name, verification_token)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email.toLowerCase(), data.password_hash, data.name, data.verification_token || null]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'avatar_url' | 'is_active' | 'last_login_at'>>
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    if (data.last_login_at !== undefined) {
      fields.push(`last_login_at = $${paramIndex++}`);
      values.push(data.last_login_at);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} AND is_active = TRUE RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async verifyEmail(token: string): Promise<User | null> {
    const result = await query<User>(
      `UPDATE users
       SET is_verified = TRUE, verification_token = NULL, updated_at = NOW()
       WHERE verification_token = $1 AND is_verified = FALSE
       RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const result = await query<User>(
      `SELECT * FROM users
       WHERE reset_password_token = $1
         AND reset_password_expires > NOW()
         AND is_active = TRUE`,
      [token]
    );
    return result.rows[0] || null;
  }

  async setResetToken(id: string, token: string, expires: Date): Promise<boolean> {
    const result = await query(
      `UPDATE users
       SET reset_password_token = $1, reset_password_expires = $2, updated_at = NOW()
       WHERE id = $3 AND is_active = TRUE`,
      [token, expires, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async clearResetToken(id: string): Promise<boolean> {
    const result = await query(
      `UPDATE users
       SET reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }
}

export const userRepository = new UserRepository();
