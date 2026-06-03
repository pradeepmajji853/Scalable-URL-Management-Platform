import { clickRepository } from '../repositories/click.repository';
import { urlRepository } from '../repositories/url.repository';
import { URLAnalytics, DashboardStats } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

class AnalyticsService {
  /**
   * Get analytics for a specific URL
   */
  async getUrlAnalytics(urlId: string, userId: string, rangeDays: number = 30): Promise<URLAnalytics> {
    const url = await urlRepository.findById(urlId);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access analytics for this URL');
    }

    const [
      clickStats,
      dailyStats,
      browserStats,
      deviceStats,
      osStats,
      countryStats,
      referrerStats,
    ] = await Promise.all([
      clickRepository.getClickStats(urlId),
      clickRepository.getDailyStats(urlId, rangeDays),
      clickRepository.getBrowserStats(urlId),
      clickRepository.getDeviceStats(urlId),
      clickRepository.getOsStats(urlId),
      clickRepository.getCountryStats(urlId),
      clickRepository.getReferrerStats(urlId),
    ]);

    return {
      url,
      click_stats: clickStats,
      daily_stats: dailyStats,
      browser_stats: browserStats,
      device_stats: deviceStats,
      os_stats: osStats,
      country_stats: countryStats,
      referrer_stats: referrerStats,
    };
  }

  /**
   * Get click trends for a URL (daily, weekly, monthly)
   */
  async getClickTrends(urlId: string, userId: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const url = await urlRepository.findById(urlId);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access analytics for this URL');
    }

    switch (interval) {
      case 'weekly':
        return clickRepository.getWeeklyStats(urlId);
      case 'monthly':
        return clickRepository.getMonthlyStats(urlId);
      case 'daily':
      default:
        return clickRepository.getDailyStats(urlId, 30);
    }
  }

  /**
   * Get dashboard overview statistics for user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [
      totalLinks,
      totalClicks,
      activeLinks,
      linksToday,
      clicksToday,
    ] = await Promise.all([
      urlRepository.countByUserId(userId),
      urlRepository.getTotalClicksByUserId(userId),
      urlRepository.getActiveCountByUserId(userId),
      urlRepository.getLinksCreatedToday(userId),
      urlRepository.getClicksToday(userId),
    ]);

    return {
      total_links: totalLinks,
      total_clicks: totalClicks,
      active_links: activeLinks,
      links_today: linksToday,
      clicks_today: clicksToday,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
