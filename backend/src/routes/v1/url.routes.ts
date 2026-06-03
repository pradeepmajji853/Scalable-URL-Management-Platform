import { Router } from 'express';
import { urlController } from '../../controllers/url.controller';
import { authenticate } from '../../middleware/auth';
import { defaultRateLimiter } from '../../middleware/rateLimiter';
import { validateBody, validateParams, validateQuery } from '../../middleware/validator';
import { createUrlSchema, updateUrlSchema, urlParamsSchema, urlQuerySchema } from '../../validators/url.validator';

const router = Router();

router.use(authenticate);

router.post('/', defaultRateLimiter, validateBody(createUrlSchema), urlController.createUrl);
router.get('/', defaultRateLimiter, validateQuery(urlQuerySchema), urlController.getUserUrls);
router.get('/:id', defaultRateLimiter, validateParams(urlParamsSchema), urlController.getUrl);
router.put('/:id', defaultRateLimiter, validateParams(urlParamsSchema), validateBody(updateUrlSchema), urlController.updateUrl);
router.delete('/:id', defaultRateLimiter, validateParams(urlParamsSchema), urlController.deleteUrl);
router.post('/:id/restore', defaultRateLimiter, validateParams(urlParamsSchema), urlController.restoreUrl);
router.get('/:shortCode/qr', defaultRateLimiter, urlController.getQrCode);

export default router;
