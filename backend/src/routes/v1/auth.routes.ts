import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter, strictRateLimiter } from '../../middleware/rateLimiter';
import { validateBody } from '../../middleware/validator';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authRateLimiter, authController.refreshToken);
router.get('/verify-email', authRateLimiter, authController.verifyEmail);
router.post('/forgot-password', strictRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', strictRateLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

export default router;
