import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  UserMinus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { teamsApi } from '../../api/teams';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { formatDate, getErrorMessage } from '../../lib/utils';

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // States
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  // Fetch teams list
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
  });

  // Automatically set selected team if none is selected
  React.useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Fetch active team details
  const { data: activeTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['team', selectedTeamId],
    queryFn: () => teamsApi.getTeam(selectedTeamId),
    enabled: !!selectedTeamId
  });

  // Fetch team members list
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: () => teamsApi.getTeamMembers(selectedTeamId),
    enabled: !!selectedTeamId
  });

  // Create Team mutation
  const createTeamMutation = useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setSelectedTeamId(newTeam.id);
      setIsCreateOpen(false);
      setTeamName('');
      setTeamDesc('');
      toast.success('Team workspace created successfully!');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Failed to create team workspace'));
    }
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: any }) => teamsApi.inviteMember(teamId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeamId] });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      toast.success('Member added successfully!');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Failed to add member to team'));
    }
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: ({ teamId, memberUserId }: { teamId: string; memberUserId: string }) => 
      teamsApi.removeMember(teamId, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeamId] });
      toast.success('Member removed from team');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Failed to remove member'));
    }
  });

  // Update member role mutation
  const roleMutation = useMutation({
    mutationFn: ({ teamId, memberUserId, role }: { teamId: string; memberUserId: string; role: string }) => 
      teamsApi.updateMemberRole(teamId, memberUserId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeamId] });
      toast.success('Member role updated successfully');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Failed to update member role'));
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeamMutation.mutate({ name: teamName, description: teamDesc });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      teamId: selectedTeamId,
      payload: { email: inviteEmail, role: inviteRole }
    });
  };

  const handleRoleChange = (memberUserId: string, newRole: string) => {
    roleMutation.mutate({
      teamId: selectedTeamId,
      memberUserId,
      role: newRole
    });
  };

  const currentUserRole = members.find((m: any) => m.userId === user?.id)?.role;
  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
            Team Workspace
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Collaborate on short links and manage members of shared workspaces
          </p>
        </div>

        <div className="flex items-center gap-3">
          {teams.length > 0 && (
            <div className="relative w-48">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-surface-200 dark:border-surface-800 text-surface-900 dark:text-surface-100 rounded-xl py-2 px-4 pr-10 text-sm focus:outline-none focus:border-primary-500 appearance-none font-medium"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            </div>
          )}
          <Button 
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Team
          </Button>
        </div>
      </div>

      {teamsLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : teams.length === 0 ? (
        <EmptyState
          title="No team workspaces"
          description="Create a team to collaborate on shortened links and campaigns."
          actionLabel="Create Team Workspace"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Team Members</h3>
                  <p className="text-xs text-surface-400 mt-0.5">Manage permissions and access levels</p>
                </div>
                {isOwnerOrAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setIsInviteOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Member
                  </Button>
                )}
              </div>

              {membersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-100 dark:divide-surface-850 text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Joined</th>
                        {isOwnerOrAdmin && <th className="pb-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-850">
                      {members.map((member: any) => (
                        <tr key={member.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="font-bold text-surface-900 dark:text-surface-100">{member.name}</div>
                            <div className="text-xs text-surface-400">{member.email}</div>
                          </td>
                          <td className="py-4 pr-4">
                            {isOwnerOrAdmin && member.role !== 'owner' && member.userId !== user?.id ? (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                className="bg-slate-900 border border-surface-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary-500 font-semibold"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <span className="capitalize text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                                {member.role}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-surface-500 pr-4">{formatDate(member.joinedAt)}</td>
                          {isOwnerOrAdmin && (
                            <td className="py-4 text-right">
                              {member.role !== 'owner' && member.userId !== user?.id && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove ${member.name} from the team?`)) {
                                      removeMutation.mutate({ teamId: selectedTeamId, memberUserId: member.userId });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 transition-colors"
                                  title="Remove Member"
                                >
                                  <UserMinus className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar Workspace Details */}
          <div>
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">About Workspace</h3>
                <p className="text-xs text-surface-400 mt-1">Shared workspace configurations</p>
              </div>

              {teamLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : activeTeam ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Slug Identifier</span>
                    <span className="text-sm font-semibold text-slate-300">/t/{activeTeam.slug}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Description</span>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {activeTeam.description || 'No description provided.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Created</span>
                    <span className="text-sm text-slate-400">{formatDate(activeTeam.createdAt)}</span>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Team Workspace">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Team Workspace Name"
            placeholder="Marketing Team, Dev Group etc."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
          <Input
            label="Description (Optional)"
            placeholder="What will this workspace be used for?"
            value={teamDesc}
            onChange={(e) => setTeamDesc(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTeamMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Add Team Member">
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Member Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Access Permission Role
            </label>
            <select
              value={inviteRole}
              onChange={(e: any) => setInviteRole(e.target.value)}
              className="w-full bg-slate-900 border border-surface-250 text-surface-900 dark:text-surface-100 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 font-semibold"
            >
              <option value="admin">Admin (Can edit links & invite members)</option>
              <option value="member">Member (Can edit links)</option>
              <option value="viewer">Viewer (Can only read analytics)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteMutation.isPending}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
