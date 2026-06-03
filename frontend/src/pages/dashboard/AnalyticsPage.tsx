import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MousePointerClick, 
  TrendingUp, 
  MapPin, 
  Monitor, 
  Globe, 
  Compass, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { urlsApi } from '../../api/urls';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { formatDate } from '../../lib/utils';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlIdParam = searchParams.get('id');
  
  const [selectedUrlId, setSelectedUrlId] = useState<string>('');

  // Fetch list of links to populate selector
  const { data: urlsRes, isLoading: urlsLoading } = useQuery({
    queryKey: ['urls-for-analytics'],
    queryFn: () => urlsApi.getUrls({ page: 1, limit: 100 })
  });

  const urlsList = urlsRes?.data || [];

  // Update selected URL if query param is set
  useEffect(() => {
    if (urlIdParam) {
      setSelectedUrlId(urlIdParam);
    } else if (urlsList.length > 0 && !selectedUrlId) {
      setSelectedUrlId(urlsList[0].id);
    }
  }, [urlIdParam, urlsList, selectedUrlId]);

  // Fetch analytics for selected link
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', selectedUrlId],
    queryFn: async () => {
      if (!selectedUrlId) return null;
      const data: any = await analyticsApi.getUrlAnalytics(selectedUrlId);
      
      // Map backend snake_case properties to frontend camelCase expected types
      return {
        url: data.url,
        totalClicks: data.click_stats?.total_clicks ?? 0,
        uniqueClicks: data.click_stats?.unique_clicks ?? 0,
        clickTrends: (data.daily_stats || []).map((t: any) => ({
          date: formatDate(t.date),
          clicks: t.clicks
        })),
        browsers: (data.browser_stats || []).map((b: any) => ({
          name: b.browser,
          value: b.count,
          percentage: b.percentage
        })),
        devices: (data.device_stats || []).map((d: any) => ({
          name: d.device_type,
          value: d.count,
          percentage: d.percentage
        })),
        countries: (data.country_stats || []).map((c: any) => ({
          name: c.country,
          count: c.count,
          percentage: c.percentage
        })),
        referrers: (data.referrer_stats || []).map((r: any) => ({
          name: r.referrer,
          count: r.count,
          percentage: r.percentage
        })),
      };
    },
    enabled: !!selectedUrlId
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedUrlId(val);
    setSearchParams({ id: val });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
            Link Analytics
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Track user conversion rates, geolocations, and traffic refers
          </p>
        </div>

        {/* Dropdown URL selector */}
        {urlsLoading ? (
          <Skeleton className="h-10 w-64 rounded-xl" />
        ) : urlsList.length > 0 ? (
          <div className="relative w-full sm:w-64">
            <select
              value={selectedUrlId}
              onChange={handleUrlChange}
              className="w-full bg-slate-900 border border-surface-200 dark:border-surface-800 text-surface-900 dark:text-surface-100 rounded-xl py-2.5 px-4 pr-10 text-sm focus:outline-none focus:border-primary-500 appearance-none font-medium"
            >
              {urlsList.map((url) => (
                <option key={url.id} value={url.id}>
                  {url.title || `/${url.shortCode}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
        ) : null}
      </div>

      {urlsList.length === 0 && !urlsLoading ? (
        <EmptyState
          title="No links created yet"
          description="Create your first shortened link to begin collecting analytics data."
        />
      ) : selectedUrlId && analyticsLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* Metadata Card */}
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {analytics.url?.title || 'Link Metadata'}
              </h2>
              <div className="text-sm font-semibold text-primary-500 mt-1">
                /{analytics.url?.short_code}
              </div>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 truncate max-w-2xl">
                Destination: <span className="text-surface-300 font-medium">{analytics.url?.original_url}</span>
              </p>
            </div>
            <div className="text-sm text-surface-400 flex items-center gap-2 bg-slate-900/30 p-3 rounded-xl border border-surface-800">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Created: {formatDate(analytics.url?.created_at)}</span>
            </div>
          </Card>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatsCard
              title="Total Clicks"
              value={analytics.totalClicks}
              icon={<MousePointerClick className="w-5 h-5" />}
            />
            <StatsCard
              title="Unique Visitors"
              value={analytics.uniqueClicks}
              icon={<Globe className="w-5 h-5" />}
            />
            <StatsCard
              title="Conversion Rate (CTR)"
              value={analytics.totalClicks > 0 ? 100 : 0}
              suffix="%"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>

          {/* Click Trends Area Chart */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-6">
              Daily Clicks Trend
            </h3>
            {analytics.clickTrends.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-surface-500">
                No clicks registered in the past 30 days.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.clickTrends}>
                    <defs>
                      <linearGradient id="colorClicksAnalytics" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicksAnalytics)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Breakdown Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Devices Pie Chart */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-400" />
                Device Breakdown
              </h3>
              {analytics.devices.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-surface-500">
                  No device data available.
                </div>
              ) : (
                <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.devices}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.devices.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {analytics.devices.map((dev: any, i: number) => (
                      <div key={dev.name} className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 capitalize">{dev.name}:</span>
                        <span className="text-sm font-bold text-surface-900 dark:text-surface-100">{dev.value} ({dev.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Browsers Pie Chart */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-400" />
                Browser Breakdown
              </h3>
              {analytics.browsers.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-surface-500">
                  No browser data available.
                </div>
              ) : (
                <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.browsers}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.browsers.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {analytics.browsers.map((brow: any, i: number) => (
                      <div key={brow.name} className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{brow.name}:</span>
                        <span className="text-sm font-bold text-surface-900 dark:text-surface-100">{brow.value} ({brow.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Geographic Bar Chart */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Geographic Breakdown
              </h3>
              {analytics.countries.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-surface-500">
                  No geolocation data available.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.countries} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Referrer Bar Chart */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                Referrers & Channels
              </h3>
              {analytics.referrers.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-surface-500">
                  No referrer data available.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.referrers} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Select a link"
          description="Choose a link from the dropdown to check analytical details."
        />
      )}
    </div>
  );
}
