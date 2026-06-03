import { query } from '../database/connection';
import { URLClick, BrowserStat, DeviceStat, OsStat, CountryStat, ReferrerStat, DailyStat, ClickStats } from '../types';

export class ClickRepository {
  async create(data: {
    url_id: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    browser?: string;
    browser_version?: string;
    os?: string;
    os_version?: string;
    device_type?: string;
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    clicked_at?: Date;
  }): Promise<URLClick> {
    const result = await query<URLClick>(
      `INSERT INTO url_clicks (url_id, ip_address, user_agent, referrer, browser, browser_version, os, os_version, device_type, country, city, region, latitude, longitude, clicked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        data.url_id,
        data.ip_address || null,
        data.user_agent || null,
        data.referrer || null,
        data.browser || null,
        data.browser_version || null,
        data.os || null,
        data.os_version || null,
        data.device_type || null,
        data.country || null,
        data.city || null,
        data.region || null,
        data.latitude || null,
        data.longitude || null,
        data.clicked_at || new Date(),
      ]
    );
    return result.rows[0];
  }

  async findByUrlId(urlId: string, limit: number = 100, offset: number = 0): Promise<URLClick[]> {
    const result = await query<URLClick>(
      `SELECT * FROM url_clicks WHERE url_id = $1 ORDER BY clicked_at DESC LIMIT $2 OFFSET $3`,
      [urlId, limit, offset]
    );
    return result.rows;
  }

  async getClickStats(urlId: string): Promise<ClickStats> {
    const result = await query<{ total_clicks: string; unique_clicks: string }>(
      `SELECT
         COUNT(*) as total_clicks,
         COUNT(DISTINCT ip_address) as unique_clicks
       FROM url_clicks
       WHERE url_id = $1`,
      [urlId]
    );
    return {
      total_clicks: parseInt(result.rows[0].total_clicks, 10),
      unique_clicks: parseInt(result.rows[0].unique_clicks, 10),
    };
  }

  async getBrowserStats(urlId: string): Promise<BrowserStat[]> {
    const result = await query<{ browser: string; count: string }>(
      `SELECT
         COALESCE(browser, 'Unknown') as browser,
         COUNT(*) as count
       FROM url_clicks
       WHERE url_id = $1
       GROUP BY browser
       ORDER BY count DESC
       LIMIT 10`,
      [urlId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    return result.rows.map((row) => ({
      browser: row.browser,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 10000) / 100 : 0,
    }));
  }

  async getDeviceStats(urlId: string): Promise<DeviceStat[]> {
    const result = await query<{ device_type: string; count: string }>(
      `SELECT
         COALESCE(device_type, 'Unknown') as device_type,
         COUNT(*) as count
       FROM url_clicks
       WHERE url_id = $1
       GROUP BY device_type
       ORDER BY count DESC
       LIMIT 10`,
      [urlId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    return result.rows.map((row) => ({
      device_type: row.device_type,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 10000) / 100 : 0,
    }));
  }

  async getOsStats(urlId: string): Promise<OsStat[]> {
    const result = await query<{ os: string; count: string }>(
      `SELECT
         COALESCE(os, 'Unknown') as os,
         COUNT(*) as count
       FROM url_clicks
       WHERE url_id = $1
       GROUP BY os
       ORDER BY count DESC
       LIMIT 10`,
      [urlId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    return result.rows.map((row) => ({
      os: row.os,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 10000) / 100 : 0,
    }));
  }

  async getCountryStats(urlId: string): Promise<CountryStat[]> {
    const result = await query<{ country: string; count: string }>(
      `SELECT
         COALESCE(country, 'Unknown') as country,
         COUNT(*) as count
       FROM url_clicks
       WHERE url_id = $1
       GROUP BY country
       ORDER BY count DESC
       LIMIT 20`,
      [urlId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    return result.rows.map((row) => ({
      country: row.country,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 10000) / 100 : 0,
    }));
  }

  async getReferrerStats(urlId: string): Promise<ReferrerStat[]> {
    const result = await query<{ referrer: string; count: string }>(
      `SELECT
         COALESCE(NULLIF(referrer, ''), 'Direct') as referrer,
         COUNT(*) as count
       FROM url_clicks
       WHERE url_id = $1
       GROUP BY referrer
       ORDER BY count DESC
       LIMIT 10`,
      [urlId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    return result.rows.map((row) => ({
      referrer: row.referrer,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 10000) / 100 : 0,
    }));
  }

  async getDailyStats(urlId: string, days: number = 30): Promise<DailyStat[]> {
    const result = await query<{ date: string; clicks: string }>(
      `SELECT
         TO_CHAR(clicked_at::date, 'YYYY-MM-DD') as date,
         COUNT(*) as clicks
       FROM url_clicks
       WHERE url_id = $1
         AND clicked_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY clicked_at::date
       ORDER BY date ASC`,
      [urlId, days]
    );

    return result.rows.map((row) => ({
      date: row.date,
      clicks: parseInt(row.clicks, 10),
    }));
  }

  async getHourlyStats(urlId: string, hours: number = 24): Promise<DailyStat[]> {
    const result = await query<{ date: string; clicks: string }>(
      `SELECT
         TO_CHAR(date_trunc('hour', clicked_at), 'YYYY-MM-DD HH24:00') as date,
         COUNT(*) as clicks
       FROM url_clicks
       WHERE url_id = $1
         AND clicked_at >= NOW() - INTERVAL '1 hour' * $2
       GROUP BY date_trunc('hour', clicked_at)
       ORDER BY date ASC`,
      [urlId, hours]
    );

    return result.rows.map((row) => ({
      date: row.date,
      clicks: parseInt(row.clicks, 10),
    }));
  }

  async getWeeklyStats(urlId: string, weeks: number = 12): Promise<DailyStat[]> {
    const result = await query<{ date: string; clicks: string }>(
      `SELECT
         TO_CHAR(date_trunc('week', clicked_at), 'YYYY-MM-DD') as date,
         COUNT(*) as clicks
       FROM url_clicks
       WHERE url_id = $1
         AND clicked_at >= NOW() - INTERVAL '1 week' * $2
       GROUP BY date_trunc('week', clicked_at)
       ORDER BY date ASC`,
      [urlId, weeks]
    );

    return result.rows.map((row) => ({
      date: row.date,
      clicks: parseInt(row.clicks, 10),
    }));
  }

  async getMonthlyStats(urlId: string, months: number = 12): Promise<DailyStat[]> {
    const result = await query<{ date: string; clicks: string }>(
      `SELECT
         TO_CHAR(date_trunc('month', clicked_at), 'YYYY-MM') as date,
         COUNT(*) as clicks
       FROM url_clicks
       WHERE url_id = $1
         AND clicked_at >= NOW() - INTERVAL '1 month' * $2
       GROUP BY date_trunc('month', clicked_at)
       ORDER BY date ASC`,
      [urlId, months]
    );

    return result.rows.map((row) => ({
      date: row.date,
      clicks: parseInt(row.clicks, 10),
    }));
  }
}

export const clickRepository = new ClickRepository();
