import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User as UserIcon, 
  Lock, 
  Key, 
  Trash2, 
  Plus, 
  Copy, 
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { apiKeysApi } from '../../api/apiKeys';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

type Tab = 'profile' | 'security' | 'api-keys';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Form states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // API Key creation form
  const [keyName, setKeyName] = useState('');
  const [keyExpires, setKeyExpires] = useState('');
  const [isKeyCreateOpen, setIsKeyCreateOpen] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Initialize profile form
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  // Fetch active API keys
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.listApiKeys,
    enabled: activeTab === 'api-keys'
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: ({ cur, nxt }: { cur: string; nxt: string }) => authApi.changePassword(cur, nxt),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  });

  // API key mutations
  const keyCreateMutation = useMutation({
    mutationFn: apiKeysApi.generateApiKey,
    onSuccess: (data: any) => {
      // The backend returns { apiKey, id, name, ... }
      setNewGeneratedKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key generated!');
      setKeyName('');
      setKeyExpires('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate API Key');
    }
  });

  const keyRevokeMutation = useMutation({
    mutationFn: apiKeysApi.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key revoked');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to revoke API Key');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name, avatar: avatarUrl || undefined });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    passwordMutation.mutate({ cur: currentPassword, nxt: newPassword });
  };

  const handleKeyCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    keyCreateMutation.mutate({
      name: keyName,
      expiresAt: keyExpires || undefined,
    });
  };

  const handleCopyKey = () => {
    if (newGeneratedKey) {
      navigator.clipboard.writeText(newGeneratedKey);
      setCopiedKey(true);
      toast.success('Copied API Key');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
          Account Settings
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Manage your security settings, profile attributes, and developer API credentials
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-surface-500 hover:text-surface-300'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-surface-500 hover:text-surface-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'api-keys'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-surface-500 hover:text-surface-300'
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                hint="Your email address is managed at sign up and verified."
              />
            </div>
            <Input
              label="Avatar URL (Optional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://gravatar.com/avatar/..."
            />

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
              <Button type="submit" isLoading={profileMutation.isPending}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Change Password</h3>
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
              <Button type="submit" isLoading={passwordMutation.isPending}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Developer API Credentials</h3>
            <Button
              size="sm"
              onClick={() => { setNewGeneratedKey(null); setIsKeyCreateOpen(true); }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Generate Key
            </Button>
          </div>

          {keysLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : apiKeys.length === 0 ? (
            <EmptyState
              title="No API keys"
              description="Create an API key to programmatically shorten links from your own code."
              actionLabel="Generate API Key"
              onAction={() => setIsKeyCreateOpen(true)}
            />
          ) : (
            <Card className="overflow-hidden border border-surface-100 dark:border-surface-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-100 dark:divide-surface-800 text-left text-sm">
                  <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Prefix</th>
                      <th className="px-6 py-3.5">Created</th>
                      <th className="px-6 py-3.5">Expires</th>
                      <th className="px-6 py-3.5">Last Used</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-surface-900 dark:text-surface-100">{key.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{key.prefix}_••••</td>
                        <td className="px-6 py-4 text-surface-500">{formatDate(key.createdAt)}</td>
                        <td className="px-6 py-4 text-surface-500">
                          {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-surface-500">
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to revoke this API Key? It cannot be undone.')) {
                                keyRevokeMutation.mutate(key.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Key Generator Modal */}
          <Modal
            isOpen={isKeyCreateOpen}
            onClose={() => setIsKeyCreateOpen(false)}
            title={newGeneratedKey ? "API Key Generated" : "Generate API Key"}
          >
            {newGeneratedKey ? (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs leading-relaxed">
                  <strong>WARNING:</strong> Copy this API key now! We show it once here for security. You will not be able to retrieve it again.
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newGeneratedKey}
                    readOnly
                    className="w-full bg-slate-900 font-mono text-sm border border-surface-800 rounded-xl p-3 pr-12 focus:outline-none text-indigo-400 font-bold"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 transition-all"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-800">
                  <Button onClick={() => setIsKeyCreateOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKeyCreateSubmit} className="space-y-4">
                <Input
                  label="API Key Name"
                  placeholder="Production Server Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  required
                />
                <Input
                  label="Expiration Date (Optional)"
                  type="date"
                  value={keyExpires}
                  onChange={(e) => setKeyExpires(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-850">
                  <Button variant="secondary" onClick={() => setIsKeyCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={keyCreateMutation.isPending}>
                    Generate
                  </Button>
                </div>
              </form>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
