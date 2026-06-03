import client from './client';
import type { ApiResponse, Team, CreateTeamRequest, InviteMemberRequest, TeamMember } from '../types';

function mapTeam(dbTeam: any): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    slug: dbTeam.slug,
    description: dbTeam.description || undefined,
    ownerId: dbTeam.owner_id || '',
    urlCount: dbTeam.url_count !== undefined ? Number(dbTeam.url_count) : undefined,
    createdAt: dbTeam.created_at || '',
    updatedAt: dbTeam.updated_at || '',
  };
}

function mapTeamMember(dbMember: any): TeamMember {
  return {
    id: dbMember.id,
    userId: dbMember.user_id || '',
    teamId: dbMember.team_id || '',
    role: dbMember.role,
    name: dbMember.name || undefined,
    email: dbMember.email || undefined,
    joinedAt: dbMember.joined_at || '',
  };
}

export const teamsApi = {
  createTeam: async (payload: CreateTeamRequest): Promise<Team> => {
    const { data } = await client.post<ApiResponse<any>>('/teams', payload);
    return mapTeam(data.data);
  },

  getTeams: async (): Promise<Team[]> => {
    const { data } = await client.get<ApiResponse<any[]>>('/teams');
    return (data.data || []).map(mapTeam);
  },

  getTeam: async (id: string): Promise<Team> => {
    const { data } = await client.get<ApiResponse<any>>(`/teams/${id}`);
    return mapTeam(data.data);
  },

  inviteMember: async (teamId: string, payload: InviteMemberRequest): Promise<TeamMember> => {
    const { data } = await client.post<ApiResponse<any>>(`/teams/${teamId}/members`, payload);
    return mapTeamMember(data.data);
  },

  removeMember: async (teamId: string, memberUserId: string): Promise<void> => {
    await client.delete(`/teams/${teamId}/members/${memberUserId}`);
  },

  updateMemberRole: async (teamId: string, memberUserId: string, role: string): Promise<TeamMember> => {
    const { data } = await client.put<ApiResponse<any>>(`/teams/${teamId}/members/${memberUserId}`, { role });
    return mapTeamMember(data.data);
  },

  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const { data } = await client.get<ApiResponse<any[]>>(`/teams/${teamId}/members`);
    return (data.data || []).map(mapTeamMember);
  },
};

export default teamsApi;
