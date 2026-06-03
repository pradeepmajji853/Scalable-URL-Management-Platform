/**
 * Integration Tests - Auth Routes
 *
 * Tests for authentication API endpoints:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - GET  /api/v1/auth/me
 * - POST /api/v1/auth/logout
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// =============================================================================
// Mock Setup
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// In-memory user store for integration tests
interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

let users: TestUser[] = [];
let refreshTokenStore: Record<string, string> = {};

// =============================================================================
// Express App Setup (Mimics real app routes)
// =============================================================================

function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // ---- Auth Middleware ----
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
        res.status(401).json({ error: 'Invalid token type' });
        return;
      }
      (req as any).userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // ---- Register ----
  app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      const existing = users.find(u => u.email === email);
      if (existing) {
        res.status(409).json({ error: 'A user with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user: TestUser = {
        id: `user-${Date.now()}`,
        email,
        password: hashedPassword,
        name,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      users.push(user);

      const accessToken = jwt.sign({ userId: user.id, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
      refreshTokenStore[user.id] = refreshToken;

      const { password: _, ...userResponse } = user;
      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ---- Login ----
  app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = users.find(u => u.email === email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const accessToken = jwt.sign({ userId: user.id, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
      refreshTokenStore[user.id] = refreshToken;

      const { password: _, ...userResponse } = user;
      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ---- Get Current User ----
  app.get('/api/v1/auth/me', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = users.find(u => u.id === userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userResponse } = user;
    res.status(200).json({ user: userResponse });
  });

  // ---- Logout ----
  app.post('/api/v1/auth/logout', authenticate, (req: Request, res: Response) => {
    const userId = (req as any).userId;
    delete refreshTokenStore[userId];
    res.status(200).json({ message: 'Logged out successfully' });
  });

  return app;
}

// =============================================================================
// Tests
// =============================================================================

describe('Auth Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    users = [];
    refreshTokenStore = {};
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/register
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
          name: 'First User',
        })
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'AnotherPass123!',
          name: 'Second User',
        })
        .expect(409);

      expect(response.body.error).toBe('A user with this email already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email, password, and name are required');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.error).toBe('Password must be at least 8 characters');
    });

    it('should not expose password in response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.user.password).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('SecurePass123!');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/login
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Pre-register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          name: 'Existing User',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('existing@example.com');
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return valid JWT tokens on login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      const decoded = jwt.verify(response.body.tokens.accessToken, JWT_SECRET) as any;
      expect(decoded.userId).toBeDefined();
      expect(decoded.type).toBe('access');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/v1/auth/me
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'me@example.com',
          password: 'SecurePass123!',
          name: 'Me User',
        });
      accessToken = response.body.tokens.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('me@example.com');
      expect(response.body.user.name).toBe('Me User');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', type: 'access' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should reject refresh token used as access token', async () => {
      const refreshToken = jwt.sign(
        { userId: 'user-123', type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token type');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/logout
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123!',
          name: 'Logout User',
        });
      accessToken = response.body.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });
});
