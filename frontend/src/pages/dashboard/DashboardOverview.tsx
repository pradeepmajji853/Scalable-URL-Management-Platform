import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Link2, 
  MousePointerClick, 
  Activity, 
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { urlsApi } from '../../api/urls';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getRelativeTime, truncateUrl } from '../../lib/utils';

export default function DashboardOverview() {
  // Fetch overall statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const data: any = await analyticsApi.getDashboardStats();
      // Map snake_case to camelCase
      return {
        totalLinks: data.total_links ?? 0,
        totalClicks: data.total_clicks ?? 0,
        activeLinks: data.active_links ?? 0,
        linksToday: data.links_today ?? 0,
        clicksToday: data.clicks_today ?? 0,
        avgCtr: data.total_links > 0 ? Math.round((data.total_clicks / data.total_links) * 10) / 10 : 0
      };
    }
  });

  // Fetch recent links
  const { data: recentLinksRes, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-links'],
    queryFn: () => urlsApi.getUrls({ page: 1, limit: 5 })
  });

  // Fetch top links
  const { data: topLinksRes, isLoading: topLoading } = useQuery({
    queryKey: ['top-links'],
    queryFn: () => urlsApi.getUrls({ page: 1, limit: 5, sort: 'click_count', order: 'desc' })
  });

  const recentLinks = recentLinksRes?.data || [];
  const topLinks = topLinksRes?.data || [];

  // Mock trend data for visualization
  const mockTrends = [
    { date: 'Mon', clicks: 120 },
    { date: 'Tue', clicks: 210 },
    { date: 'Wed', clicks: 170 },
    { date: 'Thu', clicks: 310 },
    { date: 'Fri', clicks: 280 },
    { date: 'Sat', clicks: 390 },
    { date: 'Sun', clicks: 420 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
            Dashboard Overview
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Monitor link performances, clicks velocity, and active URL redirects
          </p>
        </div>
        <RouterLink to="/dashboard/links?create=true">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create New Link
          </Button>
        </RouterLink>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatsCard
              title="Total Links"
              value={stats?.totalLinks ?? 0}
              icon={<Link2 className="w-5 h-5" />}
            />
            <StatsCard
              title="Total Clicks"
              value={stats?.totalClicks ?? 0}
              icon={<MousePointerClick className="w-5 h-5" />}
            />
            <StatsCard
              title="Active Links"
              value={stats?.activeLinks ?? 0}
              icon={<Activity className="w-5 h-5" />}
            />
            <StatsCard
              title="Avg. Clicks/Link"
              value={stats?.avgCtr ?? 0}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </>
        )}
      </div>

      {/* Click Trends Area Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-6">
          System Click Volume (Past 7 Days)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrends}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#1e293b', 
                  borderRadius: '12px',
                  color: '#f8fafc' 
                }} 
              />
              <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Links */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Recently Created
            </h3>
            <RouterLink to="/dashboard/links" className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1.5">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </RouterLink>
          </div>

          {recentLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : recentLinks.length === 0 ? (
            <EmptyState
              title="No links yet"
              description="Create your first shortened link to see it here."
            />
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {recentLinks.map((link) => (
                <div key={link.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                      {link.title || truncateUrl(link.originalUrl)}
                    </h4>
                    <p className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-2 mt-1">
                      <span className="font-semibold text-primary-500">
                        /{link.shortCode}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(link.createdAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {link.clickCount || 0} clicks
                    </span>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/../../r/${link.shortCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Performing Links */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Top Performing Links
            </h3>
            <RouterLink to="/dashboard/analytics" className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1.5">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </RouterLink>
          </div>

          {topLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : topLinks.length === 0 ? (
            <EmptyState
              title="No clicks yet"
              description="Share your short links online to start collecting analytics."
            />
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {topLinks.map((link) => (
                <div key={link.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                      {link.title || truncateUrl(link.originalUrl)}
                    </h4>
                    <p className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-2 mt-1">
                      <span className="font-semibold text-primary-500">
                        /{link.shortCode}
                      </span>
                      <span>•</span>
                      <span className="text-surface-500 font-medium truncate max-w-[150px] sm:max-w-xs block">
                        {link.originalUrl}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-indigo-400">
                      {link.clickCount || 0}
                    </span>
                    <span className="text-xs text-surface-400">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
