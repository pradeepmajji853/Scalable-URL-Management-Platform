import { query } from '../database/connection';
import { Team, TeamMember, TeamRole } from '../types';

export class TeamRepository {
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    owner_id: string;
  }): Promise<Team> {
    const result = await query<Team>(
      `INSERT INTO teams (name, slug, description, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.slug, data.description || null, data.owner_id]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Team | null> {
    const result = await query<Team>(
      'SELECT * FROM teams WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Team[]> {
    const result = await query<Team>(
      `SELECT t.* FROM teams t
       INNER JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND t.is_active = TRUE
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findBySlug(slug: string): Promise<Team | null> {
    const result = await query<Team>(
      'SELECT * FROM teams WHERE slug = $1 AND is_active = TRUE',
      [slug]
    );
    return result.rows[0] || null;
  }

  async addMember(teamId: string, userId: string, role: TeamRole = 'member'): Promise<TeamMember> {
    const result = await query<TeamMember>(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO NOTHING
       RETURNING *`,
      [teamId, userId, role]
    );
    return result.rows[0];
  }

  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 AND role != $3',
      [teamId, userId, 'owner']
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember | null> {
    const result = await query<TeamMember>(
      `UPDATE team_members SET role = $1
       WHERE team_id = $2 AND user_id = $3 AND role != 'owner'
       RETURNING *`,
      [role, teamId, userId]
    );
    return result.rows[0] || null;
  }

  async findMembers(teamId: string): Promise<Array<TeamMember & { email: string; name: string }>> {
    const result = await query<TeamMember & { email: string; name: string }>(
      `SELECT tm.*, u.email, u.name
       FROM team_members tm
       INNER JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );
    return result.rows;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2) as exists',
      [teamId, userId]
    );
    return result.rows[0].exists;
  }

  async getMemberRole(teamId: string, userId: string): Promise<TeamRole | null> {
    const result = await query<{ role: TeamRole }>(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    return result.rows[0]?.role || null;
  }

  async update(id: string, data: Partial<Pick<Team, 'name' | 'description'>>): Promise<Team | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Team>(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${paramIndex} AND is_active = TRUE RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE teams SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const teamRepository = new TeamRepository();
