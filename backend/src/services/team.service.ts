import { teamRepository } from '../repositories/team.repository';
import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { Team, TeamMember, TeamRole } from '../types';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errors';
import { slugify } from '../utils/helpers';

class TeamService {
  /**
   * Create a new team
   */
  async createTeam(userId: string, data: { name: string; description?: string }): Promise<Team> {
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let attempts = 0;

    // Unique slug generation
    while (attempts < 10) {
      const existingTeam = await teamRepository.findBySlug(slug);
      if (!existingTeam) break;
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      attempts++;
    }

    const team = await teamRepository.create({
      name: data.name,
      slug,
      description: data.description,
      owner_id: userId,
    });

    // Add owner as a member
    await teamRepository.addMember(team.id, userId, 'owner');

    // Audit log
    await auditLogRepository.create({
      user_id: userId,
      action: 'team.create',
      entity_type: 'team',
      entity_id: team.id,
    });

    return team;
  }

  /**
   * Get team details
   */
  async getTeam(teamId: string, userId: string): Promise<Team> {
    const isMember = await teamRepository.isMember(teamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    return teamRepository.findByUserId(userId);
  }

  /**
   * Invite member to team
   */
  async inviteMember(
    teamId: string,
    callerId: string,
    email: string,
    role: TeamRole = 'member'
  ): Promise<TeamMember> {
    // 1. Verify caller has permission (Owner/Admin)
    const callerRole = await teamRepository.getMemberRole(teamId, callerId);
    if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
      throw new ForbiddenError('Only team owners and admins can invite members');
    }

    // 2. Validate email and find user
    const invitedUser = await userRepository.findByEmail(email);
    if (!invitedUser) {
      throw new NotFoundError('User with this email was not found. They must register first.');
    }

    // 3. Check if already a member
    const alreadyMember = await teamRepository.isMember(teamId, invitedUser.id);
    if (alreadyMember) {
      throw new ConflictError('User is already a member of this team');
    }

    // 4. Add member
    const member = await teamRepository.addMember(teamId, invitedUser.id, role);

    // Audit log
    await auditLogRepository.create({
      user_id: callerId,
      action: 'team.member_add',
      entity_type: 'team',
      entity_id: teamId,
      new_values: { member_user_id: invitedUser.id, role },
    });

    return member;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, callerId: string, memberUserId: string): Promise<void> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // A user can leave their own team unless they are the owner
    const isSelfLeaving = callerId === memberUserId;

    if (!isSelfLeaving) {
      // Caller must be Owner or Admin
      const callerRole = await teamRepository.getMemberRole(teamId, callerId);
      if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
        throw new ForbiddenError('Only owners and admins can remove members');
      }

      // Admin cannot remove owner or another admin
      const memberRole = await teamRepository.getMemberRole(teamId, memberUserId);
      if (memberRole === 'owner') {
        throw new ForbiddenError('Cannot remove team owner');
      }
      if (callerRole === 'admin' && memberRole === 'admin') {
        throw new ForbiddenError('Admins cannot remove other admins');
      }
    } else {
      // Owners cannot just leave, they must delete or transfer ownership
      if (team.owner_id === callerId) {
        throw new ValidationError('As owner, you cannot leave the team. Transfer ownership or delete the team.');
      }
    }

    const removed = await teamRepository.removeMember(teamId, memberUserId);
    if (!removed) {
      throw new NotFoundError('Member not found in team');
    }

    // Audit log
    await auditLogRepository.create({
      user_id: callerId,
      action: isSelfLeaving ? 'team.leave' : 'team.member_remove',
      entity_type: 'team',
      entity_id: teamId,
      old_values: { member_user_id: memberUserId },
    });
  }

  /**
   * Update member role in team
   */
  async updateMemberRole(
    teamId: string,
    callerId: string,
    memberUserId: string,
    role: TeamRole
  ): Promise<TeamMember> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const callerRole = await teamRepository.getMemberRole(teamId, callerId);
    if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
      throw new ForbiddenError('Only owners and admins can update member roles');
    }

    const memberRole = await teamRepository.getMemberRole(teamId, memberUserId);
    if (!memberRole) {
      throw new NotFoundError('Member not found in team');
    }

    if (memberRole === 'owner') {
      throw new ForbiddenError('Cannot change the role of the team owner');
    }

    if (callerRole === 'admin' && (memberRole === 'admin' || role === 'admin' || role === 'owner')) {
      throw new ForbiddenError('Admins cannot manage other admin roles');
    }

    const updated = await teamRepository.updateMemberRole(teamId, memberUserId, role);
    if (!updated) {
      throw new NotFoundError('Member role update failed');
    }

    // Audit log
    await auditLogRepository.create({
      user_id: callerId,
      action: 'team.member_role_update',
      entity_type: 'team',
      entity_id: teamId,
      new_values: { member_user_id: memberUserId, role },
    });

    return updated;
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string, userId: string) {
    const isMember = await teamRepository.isMember(teamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    return teamRepository.findMembers(teamId);
  }
}

export const teamService = new TeamService();
export default teamService;
