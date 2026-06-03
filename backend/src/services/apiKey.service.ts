import { apiKeyRepository } from '../repositories/apiKey.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { hashString } from '../utils/helpers';
import { APIKey } from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

class ApiKeyService {
  /**
   * Generate a new API Key for a user
   */
  async generateApiKey(
    userId: string,
    data: { name: string; scopes?: string[]; expires_at?: string }
  ): Promise<{ apiKey: string; record: APIKey }> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('API key name is required');
    }

    // Generate secure random key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = 'lk_live';
    const apiKey = `${keyPrefix}_${rawKey}`;
    const keyHash = hashString(apiKey);

    const record = await apiKeyRepository.create({
      user_id: userId,
      name: data.name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: data.scopes,
      expires_at: data.expires_at,
    });

    // Audit log
    await auditLogRepository.create({
      user_id: userId,
      action: 'api_key.create',
      entity_type: 'api_key',
      entity_id: record.id,
    });

    return { apiKey, record };
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId: string): Promise<APIKey[]> {
    return apiKeyRepository.findByUserId(userId);
  }

  /**
   * Revoke an API Key
   */
  async revokeApiKey(id: string, userId: string): Promise<void> {
    const key = await apiKeyRepository.findById(id);
    if (!key) {
      throw new NotFoundError('API Key not found');
    }

    if (key.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to revoke this API Key');
    }

    const deactivated = await apiKeyRepository.deactivate(id, userId);
    if (!deactivated) {
      throw new ValidationError('Failed to deactivate API Key');
    }

    // Audit log
    await auditLogRepository.create({
      user_id: userId,
      action: 'api_key.revoke',
      entity_type: 'api_key',
      entity_id: id,
    });
  }

  /**
   * Validate a raw API Key from request headers
   */
  async validateApiKey(rawKey: string): Promise<APIKey> {
    const keyHash = hashString(rawKey);
    const key = await apiKeyRepository.findByKeyHash(keyHash);

    if (!key) {
      throw new ForbiddenError('Invalid or expired API Key');
    }

    // Update last used timestamp
    await apiKeyRepository.updateLastUsed(key.id);

    return key;
  }
}

export const apiKeyService = new ApiKeyService();
export default apiKeyService;
