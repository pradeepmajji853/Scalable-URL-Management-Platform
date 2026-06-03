import { Response, NextFunction } from 'express';
import { urlService } from '../services/url.service';
import { AuthRequest, CreateURLRequest, UpdateURLRequest } from '../types';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { extractClientIp } from '../utils/helpers';

class UrlController {
  createUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data: CreateURLRequest = req.body;
      const url = await urlService.createUrl(userId, data);

      createdResponse(res, url, 'URL shortened successfully');
    } catch (error) {
      next(error);
    }
  };

  getUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const url = await urlService.getUrlById(id, userId);

      successResponse(res, url, 'URL fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserUrls = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);
      const sortBy = req.query.sortBy as string || 'created_at';
      const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const search = req.query.search as string || undefined;

      const result = await urlService.getUserUrls(userId, {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
      });

      res.status(200).json({
        success: true,
        message: 'URLs fetched successfully',
        data: result.urls,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const data: UpdateURLRequest = req.body;
      const updatedUrl = await urlService.updateUrl(id, userId, data);

      successResponse(res, updatedUrl, 'URL updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await urlService.deleteUrl(id, userId);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };

  restoreUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const restored = await urlService.restoreUrl(id, userId);

      successResponse(res, restored, 'URL restored successfully');
    } catch (error) {
      next(error);
    }
  };

  getQrCode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const qrDataUri = await urlService.generateQrCode(shortCode);

      successResponse(res, { qrCode: qrDataUri }, 'QR Code generated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Main URL redirection handler (GET /r/:shortCode)
   */
  resolveUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const ip = extractClientIp(req.headers, req.socket.remoteAddress);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const referrer = req.headers['referer'] || req.headers['referrer'] || '';

      const meta = {
        ip_address: ip,
        user_agent: userAgent,
        referrer: typeof referrer === 'string' ? referrer : referrer[0],
      };

      const result = await urlService.resolveUrl(shortCode, meta);

      if (result.requiresPassword) {
        // Return JSON indicating password is required, rather than redirecting
        // The frontend page /r/:shortCode can check this API
        successResponse(res, { requiresPassword: true, id: result.url.id }, 'Password required');
        return;
      }

      // HTTP 302 Found redirect
      res.redirect(302, result.url.original_url);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /r/:shortCode/verify-password
   */
  verifyPasswordAndResolve = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const { password } = req.body;
      const ip = extractClientIp(req.headers, req.socket.remoteAddress);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const referrer = req.headers['referer'] || req.headers['referrer'] || '';

      const meta = {
        ip_address: ip,
        user_agent: userAgent,
        referrer: typeof referrer === 'string' ? referrer : referrer[0],
      };

      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required' });
        return;
      }

      const url = await urlService.verifyPasswordAndResolve(shortCode, password, meta);
      successResponse(res, { original_url: url.original_url }, 'Password verified');
    } catch (error) {
      next(error);
    }
  };
}

export const urlController = new UrlController();
export default urlController;
