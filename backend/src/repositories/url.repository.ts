import { query } from '../database/connection';
import { URL, PaginationOptions } from '../types';

export class UrlRepository {
  async findById(id: string): Promise<URL | null> {
    const result = await query<URL>(
      'SELECT * FROM urls WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByShortCode(shortCode: string): Promise<URL | null> {
    const result = await query<URL>(
      'SELECT * FROM urls WHERE (short_code = $1 OR custom_alias = $1) AND is_deleted = FALSE',
      [shortCode]
    );
    return result.rows[0] || null;
  }

  async findByUserId(
    userId: string,
    options: PaginationOptions
  ): Promise<{ urls: URL[]; total: number }> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'DESC', search } = options;
    const offset = (page - 1) * limit;
    const params: unknown[] = [userId];
    let paramIndex = 2;

    let whereClause = 'WHERE user_id = $1 AND is_deleted = FALSE';

    if (search) {
      whereClause += ` AND (
        title ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        original_url ILIKE $${paramIndex} OR
        short_code ILIKE $${paramIndex} OR
        custom_alias ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Whitelist sortBy column
    const allowedSortColumns = ['created_at', 'click_count', 'title', 'updated_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM urls ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await query<URL>(
      `SELECT * FROM urls ${whereClause}
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return { urls: result.rows, total };
  }

  async create(data: {
    user_id: string;
    original_url: string;
    short_code: string;
    custom_alias?: string;
    title?: string;
    description?: string;
    tags?: string[];
    expires_at?: string;
    password_hash?: string;
    max_clicks?: number;
  }): Promise<URL> {
    const result = await query<URL>(
      `INSERT INTO urls (user_id, original_url, short_code, custom_alias, title, description, tags, expires_at, password_hash, max_clicks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.user_id,
        data.original_url,
        data.short_code,
        data.custom_alias || null,
        data.title || null,
        data.description || null,
        data.tags || null,
        data.expires_at || null,
        data.password_hash || null,
        data.max_clicks || null,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<URL>): Promise<URL | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const updatableFields: (keyof URL)[] = [
      'original_url', 'title', 'description', 'tags',
      'expires_at', 'password_hash', 'max_clicks', 'is_active',
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<URL>(
      `UPDATE urls SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND is_deleted = FALSE
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      `UPDATE urls SET is_deleted = TRUE, is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async restore(id: string, userId: string): Promise<URL | null> {
    const result = await query<URL>(
      `UPDATE urls SET is_deleted = FALSE, is_active = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_deleted = TRUE
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async findExpired(): Promise<URL[]> {
    const result = await query<URL>(
      `SELECT * FROM urls
       WHERE expires_at IS NOT NULL
         AND expires_at < NOW()
         AND is_active = TRUE
         AND is_deleted = FALSE`
    );
    return result.rows;
  }

  async incrementClickCount(id: string): Promise<void> {
    await query(
      `UPDATE urls SET click_count = click_count + 1, last_clicked_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async deactivateExpired(): Promise<number> {
    const result = await query(
      `UPDATE urls SET is_active = FALSE, updated_at = NOW()
       WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = TRUE`
    );
    return result.rowCount ?? 0;
  }

  async shortCodeExists(shortCode: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM urls WHERE short_code = $1 OR custom_alias = $1) as exists`,
      [shortCode]
    );
    return result.rows[0].exists;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM urls WHERE user_id = $1 AND is_deleted = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getActiveCountByUserId(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM urls WHERE user_id = $1 AND is_deleted = FALSE AND is_active = TRUE',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getTotalClicksByUserId(userId: string): Promise<number> {
    const result = await query<{ total: string }>(
      'SELECT COALESCE(SUM(click_count), 0) as total FROM urls WHERE user_id = $1 AND is_deleted = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].total, 10);
  }

  async getLinksCreatedToday(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM urls
       WHERE user_id = $1 AND is_deleted = FALSE
       AND created_at >= CURRENT_DATE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getClicksToday(userId: string): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM url_clicks uc
       JOIN urls u ON uc.url_id = u.id
       WHERE u.user_id = $1 AND uc.clicked_at >= CURRENT_DATE`,
      [userId]
    );
    return parseInt(result.rows[0].total, 10);
  }
}

export const urlRepository = new UrlRepository();
