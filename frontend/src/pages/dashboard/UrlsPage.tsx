import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Copy, 
  QrCode, 
  BarChart3, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Lock, 
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { urlsApi } from '../../api/urls';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function UrlsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search & filter states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<any | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');

  // Auto-open create modal if query param "create" is true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
      // Remove query param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch URLs
  const { data: urlsRes, isLoading } = useQuery({
    queryKey: ['urls', page, debouncedSearch],
    queryFn: () => urlsApi.getUrls({ page, limit, search: debouncedSearch }),
  });

  const urls = urlsRes?.data || [];
  const pagination = urlsRes?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Copy helper
  const handleCopy = (id: string, shortCode: string) => {
    const shortUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Create URL mutation
  const createMutation = useMutation({
    mutationFn: urlsApi.createUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Short link created successfully!');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create short link.');
    }
  });

  // Edit URL mutation
  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => urlsApi.updateUrl(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      toast.success('Link updated successfully!');
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update link.');
    }
  });

  // Delete URL mutation
  const deleteMutation = useMutation({
    mutationFn: urlsApi.deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Link deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete link.');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      originalUrl,
      customAlias: customAlias || undefined,
      title: title || undefined,
      description: description || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      password: password || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrl) return;
    editMutation.mutate({
      id: selectedUrl.id,
      payload: {
        originalUrl,
        title: title || undefined,
        description: description || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        password: password || undefined,
      }
    });
  };

  const openEditModal = (url: any) => {
    setSelectedUrl(url);
    setOriginalUrl(url.originalUrl || '');
    setTitle(url.title || '');
    setDescription(url.description || '');
    setExpiresAt(url.expiresAt ? new Date(url.expiresAt).toISOString().substring(0, 16) : '');
    setPassword('');
    setIsEditOpen(true);
  };

  const openQrModal = async (url: any) => {
    setSelectedUrl(url);
    try {
      const qrData = await urlsApi.getQrCode(url.shortCode);
      setQrCodeData(qrData);
      setIsQrOpen(true);
    } catch (error) {
      toast.error('Could not generate QR Code');
    }
  };

  const resetForm = () => {
    setOriginalUrl('');
    setCustomAlias('');
    setTitle('');
    setDescription('');
    setExpiresAt('');
    setPassword('');
    setSelectedUrl(null);
    setQrCodeData(null);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
            My Links
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Shorten, customize, and manage your active redirects
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Shorten URL
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search links by title, alias, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/40 border border-surface-200 dark:border-surface-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </Card>

      {/* URLs List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : urls.length === 0 ? (
        <EmptyState
          title="No links found"
          description={search ? "Try refining your search query." : "You haven't shortened any links yet."}
          actionLabel={!search ? 'Create Link' : undefined}
          onAction={!search ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {urls.map((url) => {
            const expired = isExpired(url.expiresAt);
            const statusType = !url.isActive ? 'neutral' : expired ? 'error' : 'success';
            const statusLabel = !url.isActive ? 'Inactive' : expired ? 'Expired' : 'Active';

            return (
              <Card key={url.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-surface-100 dark:border-surface-800 hover:border-indigo-500/35 transition-all">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 truncate">
                      {url.title || 'Untitled Link'}
                    </h3>
                    <Badge variant={statusType}>{statusLabel}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-500">
                    <span className="hover:underline cursor-pointer" onClick={() => handleCopy(url.id, url.shortCode)}>
                      /{url.shortCode}
                    </span>
                    <a 
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/../../r/${url.shortCode}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-surface-400 dark:text-surface-500 truncate max-w-xl">
                    Target: <span className="hover:text-surface-300">{url.originalUrl}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created {formatDate(url.createdAt)}
                    </span>
                    {url.expiresAt && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Expires {formatDate(url.expiresAt)}
                      </span>
                    )}
                    {url.password && (
                      <span className="flex items-center gap-1 text-amber-500/80">
                        <Lock className="w-3.5 h-3.5" />
                        Password Protected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-surface-100 dark:border-surface-800 md:border-t-0 pt-3 md:pt-0">
                  <div className="text-center px-4">
                    <div className="text-xl font-black text-slate-200">{url.clickCount || 0}</div>
                    <div className="text-[10px] text-surface-500 uppercase tracking-wider">Clicks</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(url.id, url.shortCode)}
                      className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-100 dark:border-surface-800 text-surface-400 hover:text-indigo-400 transition-colors"
                      title="Copy Link"
                    >
                      {copiedId === url.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openQrModal(url)}
                      className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-100 dark:border-surface-800 text-surface-400 hover:text-primary-400 transition-colors"
                      title="QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/dashboard/analytics?id=${url.id}`}
                      className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-100 dark:border-surface-800 text-surface-400 hover:text-violet-400 transition-colors block"
                      title="Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(url)}
                      className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-100 dark:border-surface-800 text-surface-400 hover:text-amber-400 transition-colors"
                      title="Edit Link"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this link?')) {
                          deleteMutation.mutate(url.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-100 dark:border-surface-800 text-surface-400 hover:text-red-400 transition-colors"
                      title="Delete Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-surface-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(p => p - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(p => p + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Shorten a URL">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Destination URL"
            type="url"
            placeholder="https://example.com/very-long-url-path"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />
          <Input
            label="Custom Alias (Optional)"
            type="text"
            placeholder="my-campaign"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            hint="Create a readable link instead of a random hash"
          />
          <Input
            label="Link Title (Optional)"
            type="text"
            placeholder="Marketing Campaign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Description (Optional)"
            type="text"
            placeholder="Short description for campaign details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expiration Date (Optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Input
              label="Protection Password (Optional)"
              type="password"
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Link">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Destination URL"
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />
          <Input
            label="Link Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expiration Date"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Input
              label="Protection Password"
              type="password"
              placeholder="Keep blank to remain unchanged"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="QR Code Preview">
        <div className="text-center space-y-6 py-4">
          {qrCodeData && (
            <div className="inline-block p-4 bg-white rounded-2xl border border-surface-200 shadow-md">
              <img src={qrCodeData} alt="Linkly QR Code" className="w-56 h-56" />
            </div>
          )}
          <p className="text-sm text-surface-500">
            Point a smartphone camera at the code to follow redirect.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setIsQrOpen(false)}>
              Close
            </Button>
            {qrCodeData && (
              <a href={qrCodeData} download={`${selectedUrl?.shortCode || 'qrcode'}.png`}>
                <Button>Download PNG</Button>
              </a>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Simple clock icon replacement if missing
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
