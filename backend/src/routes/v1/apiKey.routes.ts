import { Router } from 'express';
import { apiKeyController } from '../../controllers/apiKey.controller';
import { authenticate } from '../../middleware/auth';
import { defaultRateLimiter } from '../../middleware/rateLimiter';
import { validateBody } from '../../middleware/validator';
import { createApiKeySchema } from '../../validators/apiKey.validator';

const router = Router();

router.use(authenticate);

router.post('/', defaultRateLimiter, validateBody(createApiKeySchema), apiKeyController.generateApiKey);
router.get('/', defaultRateLimiter, apiKeyController.listApiKeys);
router.delete('/:id', defaultRateLimiter, apiKeyController.revokeApiKey);

export default router;
