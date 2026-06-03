import { urlRepository } from '../repositories/url.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { generateShortCode, hashPassword, comparePassword } from '../utils/helpers';
import { URL, PaginationOptions, CreateURLRequest, UpdateURLRequest } from '../types';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../utils/errors';
import { cacheGet, cacheSet, cacheDel } from '../configs/redis';
import config from '../configs/index';
import { getClickQueue } from '../queues/index';
import qrcode from 'qrcode';
import logger from '../configs/logger';

class UrlService {
  /**
   * Create a new short URL
   */
  async createUrl(userId: string, data: CreateURLRequest): Promise<URL> {
    let shortCode = '';

    if (data.custom_alias) {
      // Validate custom alias format (alphanumeric, dash, underscore)
      const aliasRegex = /^[a-zA-Z0-9\-_]+$/;
      if (!aliasRegex.test(data.custom_alias)) {
        throw new ValidationError('Custom alias can only contain letters, numbers, dashes, and underscores');
      }

      if (data.custom_alias.length < 3 || data.custom_alias.length > 50) {
        throw new ValidationError('Custom alias must be between 3 and 50 characters');
      }

      // Check if custom alias is already taken
      const exists = await urlRepository.shortCodeExists(data.custom_alias);
      if (exists) {
        throw new ConflictError('Custom alias is already in use');
      }
      shortCode = data.custom_alias;
    } else {
      // Generate unique short code with collision handling
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < config.shortCode.maxRetries) {
        shortCode = generateShortCode();
        const exists = await urlRepository.shortCodeExists(shortCode);
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new ConflictError('Failed to generate a unique short code. Please try again.');
      }
    }

    let passwordHash: string | undefined = undefined;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    }

    const newUrl = await urlRepository.create({
      user_id: userId,
      original_url: data.original_url,
      short_code: shortCode,
      custom_alias: data.custom_alias,
      title: data.title,
      description: data.description,
      tags: data.tags,
      expires_at: data.expires_at,
      password_hash: passwordHash,
      max_clicks: data.max_clicks,
    });

    // Cache the new URL
    await cacheSet(`url:code:${shortCode}`, newUrl, config.cache.urlTtl);

    // Audit Log
    await auditLogRepository.create({
      user_id: userId,
      action: 'url.create',
      entity_type: 'url',
      entity_id: newUrl.id,
      new_values: newUrl as unknown as Record<string, unknown>,
    });

    return newUrl;
  }

  /**
   * Get URL by ID
   */
  async getUrlById(id: string, userId: string): Promise<URL> {
    const url = await urlRepository.findById(id);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access this URL');
    }

    return url;
  }

  /**
   * Get user's URLs with pagination/filtering
   */
  async getUserUrls(
    userId: string,
    options: PaginationOptions
  ): Promise<{ urls: URL[]; total: number }> {
    return urlRepository.findByUserId(userId, options);
  }

  /**
   * Update a URL
   */
  async updateUrl(id: string, userId: string, data: UpdateURLRequest): Promise<URL> {
    const url = await urlRepository.findById(id);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to update this URL');
    }

    const updateData: Partial<URL> = {
      title: data.title,
      description: data.description,
      tags: data.tags,
      is_active: data.is_active,
    };

    if (data.original_url !== undefined) {
      updateData.original_url = data.original_url;
    }

    if (data.expires_at !== undefined) {
      updateData.expires_at = data.expires_at ? new Date(data.expires_at) : null;
    }

    if (data.max_clicks !== undefined) {
      updateData.max_clicks = data.max_clicks;
    }

    if (data.password !== undefined) {
      updateData.password_hash = data.password ? await hashPassword(data.password) : null;
    }

    const updatedUrl = await urlRepository.update(id, updateData);
    if (!updatedUrl) {
      throw new NotFoundError('URL not found or already deleted');
    }

    // Invalidate Cache
    await cacheDel(`url:code:${url.short_code}`);
    if (url.custom_alias) {
      await cacheDel(`url:code:${url.custom_alias}`);
    }

    // Cache updated URL
    await cacheSet(`url:code:${updatedUrl.short_code}`, updatedUrl, config.cache.urlTtl);

    // Audit Log
    await auditLogRepository.create({
      user_id: userId,
      action: 'url.update',
      entity_type: 'url',
      entity_id: id,
      old_values: url as unknown as Record<string, unknown>,
      new_values: updatedUrl as unknown as Record<string, unknown>,
    });

    return updatedUrl;
  }

  /**
   * Soft delete a URL
   */
  async deleteUrl(id: string, userId: string): Promise<void> {
    const url = await urlRepository.findById(id);
    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to delete this URL');
    }

    const success = await urlRepository.softDelete(id, userId);
    if (!success) {
      throw new NotFoundError('URL already deleted');
    }

    // Invalidate Cache
    await cacheDel(`url:code:${url.short_code}`);
    if (url.custom_alias) {
      await cacheDel(`url:code:${url.custom_alias}`);
    }

    // Audit Log
    await auditLogRepository.create({
      user_id: userId,
      action: 'url.delete',
      entity_type: 'url',
      entity_id: id,
    });
  }

  /**
   * Restore a soft-deleted URL
   */
  async restoreUrl(id: string, userId: string): Promise<URL> {
    const restored = await urlRepository.restore(id, userId);
    if (!restored) {
      throw new NotFoundError('URL not found or not deleted');
    }

    // Re-cache URL
    await cacheSet(`url:code:${restored.short_code}`, restored, config.cache.urlTtl);

    // Audit Log
    await auditLogRepository.create({
      user_id: userId,
      action: 'url.restore',
      entity_type: 'url',
      entity_id: id,
      new_values: restored as unknown as Record<string, unknown>,
    });

    return restored;
  }

  /**
   * Resolve short code to original URL (with Cache-aside)
   */
  async resolveUrl(
    shortCode: string,
    meta: { ip_address: string; user_agent: string; referrer: string }
  ): Promise<{ url: URL; requiresPassword?: boolean }> {
    const cacheKey = `url:code:${shortCode}`;
    let url = await cacheGet<URL>(cacheKey);

    if (!url) {
      url = await urlRepository.findByShortCode(shortCode);
      if (url) {
        await cacheSet(cacheKey, url, config.cache.urlTtl);
      }
    }

    if (!url || !url.is_active || url.is_deleted) {
      throw new NotFoundError('URL is inactive, expired, or deleted');
    }

    // Check expiration date
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      // Mark inactive
      await urlRepository.update(url.id, { is_active: false });
      await cacheDel(cacheKey);
      throw new NotFoundError('URL has expired');
    }

    // Check click limits
    if (url.max_clicks && url.click_count >= url.max_clicks) {
      await urlRepository.update(url.id, { is_active: false });
      await cacheDel(cacheKey);
      throw new NotFoundError('URL click limit reached');
    }

    // If password is required, don't execute redirect right away
    if (url.password_hash) {
      return { url, requiresPassword: true };
    }

    // Process click asynchronously
    await this.queueClickEvent(url.id, meta);

    return { url, requiresPassword: false };
  }

  /**
   * Verify password for password protected URL
   */
  async verifyPasswordAndResolve(
    shortCode: string,
    password: string,
    meta: { ip_address: string; user_agent: string; referrer: string }
  ): Promise<URL> {
    const cacheKey = `url:code:${shortCode}`;
    let url = await cacheGet<URL>(cacheKey);

    if (!url) {
      url = await urlRepository.findByShortCode(shortCode);
    }

    if (!url || !url.is_active || url.is_deleted || !url.password_hash) {
      throw new NotFoundError('URL not found or does not require a password');
    }

    const isValid = await comparePassword(password, url.password_hash);
    if (!isValid) {
      throw new ValidationError('Invalid password');
    }

    // Process click asynchronously
    await this.queueClickEvent(url.id, meta);

    return url;
  }

  /**
   * Generate QR Code as Data URI
   */
  async generateQrCode(shortCode: string): Promise<string> {
    const shortUrl = `${config.app.url}/r/${shortCode}`;
    try {
      const dataUri = await qrcode.toDataURL(shortUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#312e81', // Indigo 900 matching Linkly colors
          light: '#ffffff',
        },
      });
      return dataUri;
    } catch (error) {
      logger.error('Failed to generate QR Code', { shortCode, error: (error as Error).message });
      throw new Error('Could not generate QR code');
    }
  }

  // ──── Private Helpers ──────────────────────────────────────────────────

  private async queueClickEvent(
    urlId: string,
    meta: { ip_address: string; user_agent: string; referrer: string }
  ): Promise<void> {
    try {
      const clickQueue = getClickQueue();
      await clickQueue.add('process-click', {
        url_id: urlId,
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
        referrer: meta.referrer,
        clicked_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to queue click event', { urlId, error: (error as Error).message });
    }
  }
}

export const urlService = new UrlService();
export default urlService;
