import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { authenticate } from '../../middleware/auth';
import { defaultRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.get('/profile', defaultRateLimiter, userController.getProfile);
router.put('/profile', defaultRateLimiter, userController.updateProfile);
router.delete('/account', defaultRateLimiter, userController.deleteAccount);

export default router;
