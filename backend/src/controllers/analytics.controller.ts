import { Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AuthRequest } from '../types';
import { successResponse } from '../utils/response';

class AnalyticsController {
  getUrlAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const rangeDays = parseInt(req.query.rangeDays as string || '30', 10);
      const analytics = await analyticsService.getUrlAnalytics(id, userId, rangeDays);

      successResponse(res, analytics, 'URL analytics fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getClickTrends = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'daily';
      const trends = await analyticsService.getClickTrends(id, userId, interval);

      successResponse(res, trends, 'URL click trends fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await analyticsService.getDashboardStats(userId);

      successResponse(res, stats, 'Dashboard statistics fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
export default analyticsController;
