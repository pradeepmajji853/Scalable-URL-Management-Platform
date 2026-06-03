/**
 * Integration Tests - URL Routes
 *
 * Tests for URL management API endpoints:
 * - POST   /api/v1/urls
 * - GET    /api/v1/urls
 * - GET    /api/v1/urls/:id
 * - PUT    /api/v1/urls/:id
 * - DELETE /api/v1/urls/:id
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// =============================================================================
// Mock Setup
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

interface UrlRecord {
  id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  clicks: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

let urls: UrlRecord[] = [];
let shortCodeCounter = 1000;

function generateShortCode(): string {
  return `sc${shortCodeCounter++}`;
}

// =============================================================================
// Express App Setup
// =============================================================================

function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Auth middleware
  const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (payload.type !== 'access') {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      (req as any).userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // ---- Create URL ----
  app.post('/api/v1/urls', authenticate, (req: Request, res: Response) => {
    const { originalUrl, customAlias, title, expiresAt } = req.body;
    const userId = (req as any).userId;

    if (!originalUrl) {
      res.status(400).json({ error: 'originalUrl is required' });
      return;
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Handle custom alias
    let shortCode: string;
    if (customAlias) {
      if (customAlias.length < 3 || customAlias.length > 30) {
        res.status(400).json({ error: 'Custom alias must be between 3 and 30 characters' });
        return;
      }
      const existing = urls.find(u => u.shortCode === customAlias && !u.deletedAt);
      if (existing) {
        res.status(409).json({ error: 'Custom alias is already taken' });
        return;
      }
      shortCode = customAlias;
    } else {
      shortCode = generateShortCode();
    }

    const url: UrlRecord = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId,
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      title: title || null,
      clicks: 0,
      isActive: true,
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    urls.push(url);

    res.status(201).json({
      message: 'URL created successfully',
      url: {
        ...url,
        shortUrl: `${process.env.APP_URL}/r/${shortCode}`,
      },
    });
  });

  // ---- List URLs ----
  app.get('/api/v1/urls', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const userUrls = urls.filter(u => u.userId === userId && !u.deletedAt);
    const total = userUrls.length;
    const paginatedUrls = userUrls.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      urls: paginatedUrls.map(u => ({
        ...u,
        shortUrl: `${process.env.APP_URL}/r/${u.shortCode}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // ---- Get URL by ID ----
  app.get('/api/v1/urls/:id', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const url = urls.find(u => u.id === req.params.id && !u.deletedAt);

    if (!url) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    if (url.userId !== userId) {
      res.status(403).json({ error: 'You do not have access to this URL' });
      return;
    }

    res.status(200).json({
      url: {
        ...url,
        shortUrl: `${process.env.APP_URL}/r/${url.shortCode}`,
      },
    });
  });

  // ---- Update URL ----
  app.put('/api/v1/urls/:id', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const urlIndex = urls.findIndex(u => u.id === req.params.id && !u.deletedAt);

    if (urlIndex === -1) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    if (urls[urlIndex].userId !== userId) {
      res.status(403).json({ error: 'You do not have access to this URL' });
      return;
    }

    const { title, originalUrl, isActive } = req.body;

    if (originalUrl) {
      try {
        new URL(originalUrl);
      } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
      }
      urls[urlIndex].originalUrl = originalUrl;
    }

    if (title !== undefined) urls[urlIndex].title = title;
    if (isActive !== undefined) urls[urlIndex].isActive = isActive;
    urls[urlIndex].updatedAt = new Date().toISOString();

    res.status(200).json({
      message: 'URL updated successfully',
      url: {
        ...urls[urlIndex],
        shortUrl: `${process.env.APP_URL}/r/${urls[urlIndex].shortCode}`,
      },
    });
  });

  // ---- Delete URL ----
  app.delete('/api/v1/urls/:id', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const urlIndex = urls.findIndex(u => u.id === req.params.id && !u.deletedAt);

    if (urlIndex === -1) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    if (urls[urlIndex].userId !== userId) {
      res.status(403).json({ error: 'You do not have access to this URL' });
      return;
    }

    urls[urlIndex].deletedAt = new Date().toISOString();
    urls[urlIndex].updatedAt = new Date().toISOString();

    res.status(200).json({ message: 'URL deleted successfully' });
  });

  return app;
}

// =============================================================================
// Tests
// =============================================================================

describe('URL Routes Integration Tests', () => {
  let app: express.Application;
  let accessToken: string;
  const userId = 'test-user-001';

  beforeAll(() => {
    app = createApp();
    accessToken = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    urls = [];
    shortCodeCounter = 1000;
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/urls
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/urls', () => {
    it('should create a short URL successfully', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com/very/long/url',
          title: 'Example',
        })
        .expect(201);

      expect(response.body.message).toBe('URL created successfully');
      expect(response.body.url).toBeDefined();
      expect(response.body.url.originalUrl).toBe('https://www.example.com/very/long/url');
      expect(response.body.url.shortCode).toBeDefined();
      expect(response.body.url.shortUrl).toContain('/r/');
      expect(response.body.url.title).toBe('Example');
    });

    it('should create a URL with custom alias', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com',
          customAlias: 'my-brand',
        })
        .expect(201);

      expect(response.body.url.shortCode).toBe('my-brand');
      expect(response.body.url.customAlias).toBe('my-brand');
    });

    it('should return 409 for duplicate custom alias', async () => {
      await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com',
          customAlias: 'taken-alias',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.different.com',
          customAlias: 'taken-alias',
        })
        .expect(409);

      expect(response.body.error).toBe('Custom alias is already taken');
    });

    it('should return 400 for missing originalUrl', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'No URL' })
        .expect(400);

      expect(response.body.error).toBe('originalUrl is required');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ originalUrl: 'not-a-valid-url' })
        .expect(400);

      expect(response.body.error).toBe('Invalid URL format');
    });

    it('should return 400 for custom alias too short', async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com',
          customAlias: 'ab',
        })
        .expect(400);

      expect(response.body.error).toBe('Custom alias must be between 3 and 30 characters');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/urls')
        .send({ originalUrl: 'https://www.example.com' })
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/urls
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/urls', () => {
    beforeEach(async () => {
      // Create some test URLs
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/v1/urls')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ originalUrl: `https://www.example.com/page/${i}` });
      }
    });

    it('should return paginated list of user URLs', async () => {
      const response = await request(app)
        .get('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.urls).toBeDefined();
      expect(response.body.urls.length).toBe(10); // default limit
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should support pagination params', async () => {
      const response = await request(app)
        .get('/api/v1/urls?page=2&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.urls.length).toBe(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should not return URLs from other users', async () => {
      const otherToken = jwt.sign({ userId: 'other-user', type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get('/api/v1/urls')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.urls.length).toBe(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/urls')
        .expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/urls/:id
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/urls/:id', () => {
    let testUrlId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com/specific',
          title: 'Specific Page',
        });
      testUrlId = response.body.url.id;
    });

    it('should return a specific URL by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.url).toBeDefined();
      expect(response.body.url.id).toBe(testUrlId);
      expect(response.body.url.originalUrl).toBe('https://www.example.com/specific');
      expect(response.body.url.title).toBe('Specific Page');
    });

    it('should return 404 for non-existent URL', async () => {
      const response = await request(app)
        .get('/api/v1/urls/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.error).toBe('URL not found');
    });

    it('should return 403 when accessing another user\'s URL', async () => {
      const otherToken = jwt.sign({ userId: 'other-user', type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .get(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.error).toBe('You do not have access to this URL');
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /api/v1/urls/:id
  // ---------------------------------------------------------------------------
  describe('PUT /api/v1/urls/:id', () => {
    let testUrlId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://www.example.com/original',
          title: 'Original Title',
        });
      testUrlId = response.body.url.id;
    });

    it('should update URL title', async () => {
      const response = await request(app)
        .put(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.message).toBe('URL updated successfully');
      expect(response.body.url.title).toBe('Updated Title');
    });

    it('should update original URL', async () => {
      const response = await request(app)
        .put(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ originalUrl: 'https://www.updated.com/new-path' })
        .expect(200);

      expect(response.body.url.originalUrl).toBe('https://www.updated.com/new-path');
    });

    it('should deactivate URL', async () => {
      const response = await request(app)
        .put(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.url.isActive).toBe(false);
    });

    it('should return 400 for invalid URL format on update', async () => {
      const response = await request(app)
        .put(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ originalUrl: 'not-valid' })
        .expect(400);

      expect(response.body.error).toBe('Invalid URL format');
    });

    it('should return 404 for non-existent URL', async () => {
      await request(app)
        .put('/api/v1/urls/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });

    it('should return 403 when updating another user\'s URL', async () => {
      const otherToken = jwt.sign({ userId: 'other-user', type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

      await request(app)
        .put(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/v1/urls/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /api/v1/urls/:id', () => {
    let testUrlId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ originalUrl: 'https://www.example.com/to-delete' });
      testUrlId = response.body.url.id;
    });

    it('should delete (soft delete) a URL', async () => {
      const response = await request(app)
        .delete(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('URL deleted successfully');

      // Verify it's no longer accessible
      await request(app)
        .get(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent URL', async () => {
      await request(app)
        .delete('/api/v1/urls/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when deleting another user\'s URL', async () => {
      const otherToken = jwt.sign({ userId: 'other-user', type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

      await request(app)
        .delete(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should not appear in list after deletion', async () => {
      // Delete the URL
      await request(app)
        .delete(`/api/v1/urls/${testUrlId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Check the list
      const response = await request(app)
        .get('/api/v1/urls')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const foundUrl = response.body.urls.find((u: any) => u.id === testUrlId);
      expect(foundUrl).toBeUndefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/v1/urls/${testUrlId}`)
        .expect(401);
    });
  });
});
