/**
 * Unit Tests - URL Service
 *
 * Tests for URL shortening service methods:
 * - Create short URL
 * - Resolve/redirect URL
 * - Delete and restore URLs
 * - Custom alias handling
 */

import { nanoid } from 'nanoid';

// =============================================================================
// Mock Setup
// =============================================================================

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'abc12345'),
}));

const mockUrlRepository = {
  findByShortCode: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  incrementClicks: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
};

const mockAnalyticsQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
};

// =============================================================================
// URL Service Implementation (testable inline)
// =============================================================================

interface UrlRecord {
  id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  clicks: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CreateUrlInput {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  expiresAt?: Date;
  userId: string;
}

const CACHE_TTL = 3600; // 1 hour
const APP_URL = process.env.APP_URL || 'http://localhost';

class UrlService {
  async createUrl(input: CreateUrlInput): Promise<UrlRecord> {
    let shortCode: string;

    if (input.customAlias) {
      const existing = await mockUrlRepository.findByShortCode(input.customAlias);
      if (existing) {
        throw new Error('Custom alias is already taken');
      }
      shortCode = input.customAlias;
    } else {
      shortCode = await this.generateUniqueShortCode();
    }

    const url = await mockUrlRepository.create({
      userId: input.userId,
      originalUrl: input.originalUrl,
      shortCode,
      customAlias: input.customAlias || null,
      title: input.title || null,
      expiresAt: input.expiresAt || null,
    });

    // Cache the URL mapping
    await mockRedis.setex(`url:${shortCode}`, CACHE_TTL, input.originalUrl);

    return url;
  }

  async resolveUrl(shortCode: string, metadata?: { ip?: string; userAgent?: string }): Promise<string> {
    // Check cache first
    const cachedUrl = await mockRedis.get(`url:${shortCode}`);
    if (cachedUrl) {
      // Queue analytics tracking asynchronously
      if (metadata) {
        await mockAnalyticsQueue.add('track-click', { shortCode, ...metadata });
      }
      await mockUrlRepository.incrementClicks(shortCode);
      return cachedUrl;
    }

    // Cache miss - query database
    const urlRecord = await mockUrlRepository.findByShortCode(shortCode);
    if (!urlRecord) {
      throw new Error('URL not found');
    }

    if (!urlRecord.isActive) {
      throw new Error('URL has been deactivated');
    }

    if (urlRecord.expiresAt && new Date(urlRecord.expiresAt) < new Date()) {
      throw new Error('URL has expired');
    }

    // Update cache
    await mockRedis.setex(`url:${shortCode}`, CACHE_TTL, urlRecord.originalUrl);

    // Track click
    if (metadata) {
      await mockAnalyticsQueue.add('track-click', { shortCode, ...metadata });
    }
    await mockUrlRepository.incrementClicks(shortCode);

    return urlRecord.originalUrl;
  }

  async deleteUrl(urlId: string, userId: string): Promise<void> {
    const url = await mockUrlRepository.findById(urlId);
    if (!url) {
      throw new Error('URL not found');
    }
    if (url.userId !== userId) {
      throw new Error('Unauthorized: You do not own this URL');
    }

    await mockUrlRepository.softDelete(urlId);
    await mockRedis.del(`url:${url.shortCode}`);
  }

  async restoreUrl(urlId: string, userId: string): Promise<UrlRecord> {
    const url = await mockUrlRepository.findById(urlId);
    if (!url) {
      throw new Error('URL not found');
    }
    if (url.userId !== userId) {
      throw new Error('Unauthorized: You do not own this URL');
    }
    if (!url.deletedAt) {
      throw new Error('URL is not deleted');
    }

    const restored = await mockUrlRepository.restore(urlId);
    await mockRedis.setex(`url:${restored.shortCode}`, CACHE_TTL, restored.originalUrl);

    return restored;
  }

  private async generateUniqueShortCode(maxRetries = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const code = nanoid(8);
      const existing = await mockUrlRepository.findByShortCode(code);
      if (!existing) {
        return code;
      }
    }
    throw new Error('Failed to generate a unique short code after multiple attempts');
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('UrlService', () => {
  let urlService: UrlService;

  const mockUrl: UrlRecord = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: 'user-123',
    originalUrl: 'https://www.example.com/very/long/path/to/resource',
    shortCode: 'abc12345',
    customAlias: null,
    title: 'Example Page',
    clicks: 0,
    isActive: true,
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    urlService = new UrlService();
    (nanoid as jest.Mock).mockReturnValue('abc12345');
  });

  // ---------------------------------------------------------------------------
  // Create URL Tests
  // ---------------------------------------------------------------------------
  describe('createUrl', () => {
    it('should create a short URL with auto-generated code', async () => {
      mockUrlRepository.findByShortCode.mockResolvedValue(null);
      mockUrlRepository.create.mockResolvedValue(mockUrl);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await urlService.createUrl({
        originalUrl: 'https://www.example.com/very/long/path/to/resource',
        userId: 'user-123',
        title: 'Example Page',
      });

      expect(result).toBeDefined();
      expect(result.shortCode).toBe('abc12345');
      expect(result.originalUrl).toBe('https://www.example.com/very/long/path/to/resource');
      expect(mockUrlRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'url:abc12345',
        CACHE_TTL,
        'https://www.example.com/very/long/path/to/resource'
      );
    });

    it('should create a short URL with a custom alias', async () => {
      const customUrl = { ...mockUrl, shortCode: 'my-brand', customAlias: 'my-brand' };
      mockUrlRepository.findByShortCode.mockResolvedValue(null);
      mockUrlRepository.create.mockResolvedValue(customUrl);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await urlService.createUrl({
        originalUrl: 'https://www.example.com',
        customAlias: 'my-brand',
        userId: 'user-123',
      });

      expect(result.shortCode).toBe('my-brand');
      expect(result.customAlias).toBe('my-brand');
      expect(mockUrlRepository.findByShortCode).toHaveBeenCalledWith('my-brand');
    });

    it('should throw when custom alias is already taken', async () => {
      mockUrlRepository.findByShortCode.mockResolvedValue(mockUrl);

      await expect(
        urlService.createUrl({
          originalUrl: 'https://www.example.com',
          customAlias: 'abc12345',
          userId: 'user-123',
        })
      ).rejects.toThrow('Custom alias is already taken');

      expect(mockUrlRepository.create).not.toHaveBeenCalled();
    });

    it('should handle short code collision by retrying', async () => {
      const existingUrl = { ...mockUrl, shortCode: 'abc12345' };
      let callCount = 0;

      // First call returns existing (collision), second returns null (unique)
      mockUrlRepository.findByShortCode.mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? existingUrl : null;
      });
      (nanoid as jest.Mock)
        .mockReturnValueOnce('abc12345')
        .mockReturnValueOnce('xyz98765');
      mockUrlRepository.create.mockResolvedValue({ ...mockUrl, shortCode: 'xyz98765' });
      mockRedis.setex.mockResolvedValue('OK');

      const result = await urlService.createUrl({
        originalUrl: 'https://www.example.com',
        userId: 'user-123',
      });

      expect(result.shortCode).toBe('xyz98765');
      expect(nanoid).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries for collision', async () => {
      mockUrlRepository.findByShortCode.mockResolvedValue(mockUrl);
      (nanoid as jest.Mock).mockReturnValue('collision');

      await expect(
        urlService.createUrl({
          originalUrl: 'https://www.example.com',
          userId: 'user-123',
        })
      ).rejects.toThrow('Failed to generate a unique short code');
    });

    it('should create a URL with expiration date', async () => {
      const futureDate = new Date('2025-12-31');
      const expiringUrl = { ...mockUrl, expiresAt: futureDate };
      mockUrlRepository.findByShortCode.mockResolvedValue(null);
      mockUrlRepository.create.mockResolvedValue(expiringUrl);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await urlService.createUrl({
        originalUrl: 'https://www.example.com',
        userId: 'user-123',
        expiresAt: futureDate,
      });

      expect(result.expiresAt).toEqual(futureDate);
      expect(mockUrlRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: futureDate })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Resolve URL Tests
  // ---------------------------------------------------------------------------
  describe('resolveUrl', () => {
    it('should resolve from cache on cache hit', async () => {
      mockRedis.get.mockResolvedValue('https://www.example.com');
      mockUrlRepository.incrementClicks.mockResolvedValue(undefined);
      mockAnalyticsQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await urlService.resolveUrl('abc12345', {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toBe('https://www.example.com');
      expect(mockRedis.get).toHaveBeenCalledWith('url:abc12345');
      expect(mockUrlRepository.findByShortCode).not.toHaveBeenCalled();
      expect(mockUrlRepository.incrementClicks).toHaveBeenCalledWith('abc12345');
      expect(mockAnalyticsQueue.add).toHaveBeenCalledWith('track-click', {
        shortCode: 'abc12345',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should resolve from database on cache miss and update cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUrlRepository.findByShortCode.mockResolvedValue(mockUrl);
      mockRedis.setex.mockResolvedValue('OK');
      mockUrlRepository.incrementClicks.mockResolvedValue(undefined);

      const result = await urlService.resolveUrl('abc12345');

      expect(result).toBe('https://www.example.com/very/long/path/to/resource');
      expect(mockUrlRepository.findByShortCode).toHaveBeenCalledWith('abc12345');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'url:abc12345',
        CACHE_TTL,
        'https://www.example.com/very/long/path/to/resource'
      );
    });

    it('should throw for non-existent short code', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUrlRepository.findByShortCode.mockResolvedValue(null);

      await expect(urlService.resolveUrl('nonexistent')).rejects.toThrow('URL not found');
    });

    it('should throw for deactivated URL', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUrlRepository.findByShortCode.mockResolvedValue({
        ...mockUrl,
        isActive: false,
      });

      await expect(urlService.resolveUrl('abc12345')).rejects.toThrow('URL has been deactivated');
    });

    it('should throw for expired URL', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUrlRepository.findByShortCode.mockResolvedValue({
        ...mockUrl,
        expiresAt: new Date('2020-01-01'), // Past date
      });

      await expect(urlService.resolveUrl('abc12345')).rejects.toThrow('URL has expired');
    });

    it('should allow non-expired URL', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockRedis.get.mockResolvedValue(null);
      mockUrlRepository.findByShortCode.mockResolvedValue({
        ...mockUrl,
        expiresAt: futureDate,
      });
      mockRedis.setex.mockResolvedValue('OK');
      mockUrlRepository.incrementClicks.mockResolvedValue(undefined);

      const result = await urlService.resolveUrl('abc12345');
      expect(result).toBe(mockUrl.originalUrl);
    });
  });

  // ---------------------------------------------------------------------------
  // Delete URL Tests
  // ---------------------------------------------------------------------------
  describe('deleteUrl', () => {
    it('should soft delete a URL owned by the user', async () => {
      mockUrlRepository.findById.mockResolvedValue(mockUrl);
      mockUrlRepository.softDelete.mockResolvedValue(undefined);
      mockRedis.del.mockResolvedValue(1);

      await urlService.deleteUrl(mockUrl.id, 'user-123');

      expect(mockUrlRepository.softDelete).toHaveBeenCalledWith(mockUrl.id);
      expect(mockRedis.del).toHaveBeenCalledWith('url:abc12345');
    });

    it('should throw when URL is not found', async () => {
      mockUrlRepository.findById.mockResolvedValue(null);

      await expect(urlService.deleteUrl('nonexistent-id', 'user-123')).rejects.toThrow(
        'URL not found'
      );
    });

    it('should throw when user does not own the URL', async () => {
      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(urlService.deleteUrl(mockUrl.id, 'different-user')).rejects.toThrow(
        'Unauthorized: You do not own this URL'
      );

      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Restore URL Tests
  // ---------------------------------------------------------------------------
  describe('restoreUrl', () => {
    it('should restore a soft-deleted URL', async () => {
      const deletedUrl = { ...mockUrl, deletedAt: new Date() };
      const restoredUrl = { ...mockUrl, deletedAt: null };

      mockUrlRepository.findById.mockResolvedValue(deletedUrl);
      mockUrlRepository.restore.mockResolvedValue(restoredUrl);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await urlService.restoreUrl(mockUrl.id, 'user-123');

      expect(result.deletedAt).toBeNull();
      expect(mockUrlRepository.restore).toHaveBeenCalledWith(mockUrl.id);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'url:abc12345',
        CACHE_TTL,
        mockUrl.originalUrl
      );
    });

    it('should throw when URL is not found', async () => {
      mockUrlRepository.findById.mockResolvedValue(null);

      await expect(urlService.restoreUrl('nonexistent-id', 'user-123')).rejects.toThrow(
        'URL not found'
      );
    });

    it('should throw when user does not own the URL', async () => {
      const deletedUrl = { ...mockUrl, deletedAt: new Date() };
      mockUrlRepository.findById.mockResolvedValue(deletedUrl);

      await expect(urlService.restoreUrl(mockUrl.id, 'different-user')).rejects.toThrow(
        'Unauthorized: You do not own this URL'
      );
    });

    it('should throw when URL is not deleted', async () => {
      mockUrlRepository.findById.mockResolvedValue(mockUrl); // deletedAt is null

      await expect(urlService.restoreUrl(mockUrl.id, 'user-123')).rejects.toThrow(
        'URL is not deleted'
      );
    });
  });
});
