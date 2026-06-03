import { urlRepository } from '../repositories/url.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { apiKeyRepository } from '../repositories/apiKey.repository';
import logger from '../configs/logger';

/**
 * Perform database cleanup for expired records
 */
export async function runCleanup(): Promise<void> {
  logger.info('[CleanupJob] Starting database maintenance and cleanup...');

  try {
    const deactivatedUrls = await urlRepository.deactivateExpired();
    logger.info(`[CleanupJob] Deactivated ${deactivatedUrls} expired URLs.`);

    const deletedTokens = await refreshTokenRepository.deleteExpired();
    logger.info(`[CleanupJob] Removed ${deletedTokens} expired refresh tokens.`);

    const deletedApiKeys = await apiKeyRepository.deleteExpired();
    logger.info(`[CleanupJob] Removed ${deletedApiKeys} expired API Keys.`);

    logger.info('[CleanupJob] Maintenance and cleanup completed successfully.');
  } catch (error) {
    logger.error('[CleanupJob] Error executing database cleanup', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}
