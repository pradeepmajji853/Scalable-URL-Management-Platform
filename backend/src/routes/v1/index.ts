import { Router } from 'express';
import authRoutes from './auth.routes';
import urlRoutes from './url.routes';
import analyticsRoutes from './analytics.routes';
import teamRoutes from './team.routes';
import userRoutes from './user.routes';
import apiKeyRoutes from './apiKey.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/urls', urlRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/teams', teamRoutes);
router.use('/users', userRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/health', healthRoutes);

export default router;
