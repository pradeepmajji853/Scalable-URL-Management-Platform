import client from './client';
import type {
  ApiResponse,
  AnalyticsData,
  ClickTrend,
  BrowserStat,
  DeviceStat,
  CountryStat,
  ReferrerStat,
  DashboardStats,
} from '../types';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d' | '12m' | 'all';
}

export const analyticsApi = {
  getUrlAnalytics: async (urlId: string, params?: DateRangeParams): Promise<AnalyticsData> => {
    const { data } = await client.get<ApiResponse<AnalyticsData>>(`/analytics/urls/${urlId}`, { params });
    return data.data;
  },

  getClickTrends: async (urlId: string, params?: DateRangeParams): Promise<ClickTrend[]> => {
    const { data } = await client.get<ApiResponse<ClickTrend[]>>(`/analytics/urls/${urlId}/trends`, { params });
    return data.data;
  },

  getBrowserBreakdown: async (urlId: string, params?: DateRangeParams): Promise<BrowserStat[]> => {
    const { data } = await client.get<ApiResponse<BrowserStat[]>>(`/analytics/urls/${urlId}/browsers`, { params });
    return data.data;
  },

  getDeviceBreakdown: async (urlId: string, params?: DateRangeParams): Promise<DeviceStat[]> => {
    const { data } = await client.get<ApiResponse<DeviceStat[]>>(`/analytics/urls/${urlId}/devices`, { params });
    return data.data;
  },

  getCountryBreakdown: async (urlId: string, params?: DateRangeParams): Promise<CountryStat[]> => {
    const { data } = await client.get<ApiResponse<CountryStat[]>>(`/analytics/urls/${urlId}/countries`, { params });
    return data.data;
  },

  getReferrerBreakdown: async (urlId: string, params?: DateRangeParams): Promise<ReferrerStat[]> => {
    const { data } = await client.get<ApiResponse<ReferrerStat[]>>(`/analytics/urls/${urlId}/referrers`, { params });
    return data.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await client.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return data.data;
  },
};
