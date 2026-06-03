import { Router } from 'express';
import { analyticsController } from '../../controllers/analytics.controller';
import { authenticate } from '../../middleware/auth';
import { defaultRateLimiter } from '../../middleware/rateLimiter';
import { validateParams } from '../../middleware/validator';
import { urlParamsSchema } from '../../validators/url.validator';

const router = Router();

router.use(authenticate);

router.get('/urls/:id', defaultRateLimiter, validateParams(urlParamsSchema), analyticsController.getUrlAnalytics);
router.get('/urls/:id/trends', defaultRateLimiter, validateParams(urlParamsSchema), analyticsController.getClickTrends);
router.get('/dashboard', defaultRateLimiter, analyticsController.getDashboardStats);

export default router;
