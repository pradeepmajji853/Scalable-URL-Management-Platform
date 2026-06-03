import { query } from '../database/connection';
import { AuditLog } from '../types';

export class AuditLogRepository {
  async create(data: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<AuditLog> {
    const result = await query<AuditLog>(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.user_id,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.old_values ? JSON.stringify(data.old_values) : null,
        data.new_values ? JSON.stringify(data.new_values) : null,
        data.ip_address || null,
        data.user_agent || null,
      ]
    );
    return result.rows[0];
  }

  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const result = await query<AuditLog>(
      `SELECT * FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async findByEntity(entityType: string, entityId: string, limit: number = 50): Promise<AuditLog[]> {
    const result = await query<AuditLog>(
      `SELECT * FROM audit_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    );
    return result.rows;
  }

  async deleteOlderThan(days: number): Promise<number> {
    const result = await query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 day' * $1`,
      [days]
    );
    return result.rowCount ?? 0;
  }
}

export const auditLogRepository = new AuditLogRepository();
