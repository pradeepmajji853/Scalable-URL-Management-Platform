/**
 * Unit Tests - Auth Service
 *
 * Tests for authentication service methods:
 * - User registration
 * - User login
 * - JWT token generation and verification
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock user repository
const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
};

// =============================================================================
// Auth Service (inline implementation for testability)
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(input: RegisterInput): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const existingUser = await mockUserRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await mockUserRepository.create({
      ...input,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async login(input: LoginInput): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const user = await mockUserRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): { userId: string; type: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  verifyRefreshToken(token: string): { userId: string; type: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    await mockRedis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, token);
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('AuthService', () => {
  let authService: AuthService;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john@example.com',
    password: '$2a$12$LQv3c1yqBo9SkvXS7QTJj.KOzYg3Fv3O9DdVGfmVv5DOxFEBIKPi2', // hashed "Password123!"
    name: 'John Doe',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  // ---------------------------------------------------------------------------
  // Registration Tests
  // ---------------------------------------------------------------------------
  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await authService.register({
        email: 'john@example.com',
        password: 'Password123!',
        name: 'John Doe',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.name).toBe('John Doe');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when registering with a duplicate email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'john@example.com',
          password: 'Password123!',
          name: 'John Doe',
        })
      ).rejects.toThrow('A user with this email already exists');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should hash the password before storing', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(async (data: any) => ({
        ...mockUser,
        password: data.password,
      }));
      mockRedis.setex.mockResolvedValue('OK');

      await authService.register({
        email: 'john@example.com',
        password: 'Password123!',
        name: 'John Doe',
      });

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('Password123!');
      expect(await bcrypt.compare('Password123!', createCall.password)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Login Tests
  // ---------------------------------------------------------------------------
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const userWithHash = { ...mockUser, password: hashedPassword };
      mockUserRepository.findByEmail.mockResolvedValue(userWithHash);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await authService.login({
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw an error with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const userWithHash = { ...mockUser, password: hashedPassword };
      mockUserRepository.findByEmail.mockResolvedValue(userWithHash);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should return same error for wrong email and wrong password (no leaking)', async () => {
      // Test that the error message is the same for both cases
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const error1 = await authService.login({
        email: 'wrong@example.com',
        password: 'Password123!',
      }).catch((e: Error) => e.message);

      const hashedPassword = await bcrypt.hash('Password123!', 12);
      mockUserRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });
      const error2 = await authService.login({
        email: 'john@example.com',
        password: 'WrongPassword!',
      }).catch((e: Error) => e.message);

      expect(error1).toBe(error2);
      expect(error1).toBe('Invalid email or password');
    });
  });

  // ---------------------------------------------------------------------------
  // JWT Token Tests
  // ---------------------------------------------------------------------------
  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = authService.generateTokens('user-123');

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate tokens with correct payload', () => {
      const tokens = authService.generateTokens('user-123');

      const accessPayload = jwt.decode(tokens.accessToken) as any;
      const refreshPayload = jwt.decode(tokens.refreshToken) as any;

      expect(accessPayload.userId).toBe('user-123');
      expect(accessPayload.type).toBe('access');
      expect(refreshPayload.userId).toBe('user-123');
      expect(refreshPayload.type).toBe('refresh');
    });

    it('should set expiry on tokens', () => {
      const tokens = authService.generateTokens('user-123');

      const accessPayload = jwt.decode(tokens.accessToken) as any;
      const refreshPayload = jwt.decode(tokens.refreshToken) as any;

      expect(accessPayload.exp).toBeDefined();
      expect(refreshPayload.exp).toBeDefined();
      expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const tokens = authService.generateTokens('user-123');
      const payload = authService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe('user-123');
      expect(payload.type).toBe('access');
    });

    it('should reject a refresh token used as access token', () => {
      const tokens = authService.generateTokens('user-123');

      expect(() => authService.verifyAccessToken(tokens.refreshToken)).toThrow(
        'Invalid token type'
      );
    });

    it('should reject an invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid-token')).toThrow(
        'Invalid or expired token'
      );
    });

    it('should reject an expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', type: 'access' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      expect(() => authService.verifyAccessToken(expiredToken)).toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const tokens = authService.generateTokens('user-123');
      const payload = authService.verifyRefreshToken(tokens.refreshToken);

      expect(payload.userId).toBe('user-123');
      expect(payload.type).toBe('refresh');
    });

    it('should reject an access token used as refresh token', () => {
      const tokens = authService.generateTokens('user-123');

      expect(() => authService.verifyRefreshToken(tokens.accessToken)).toThrow(
        'Invalid token type'
      );
    });

    it('should reject an invalid refresh token', () => {
      expect(() => authService.verifyRefreshToken('invalid-token')).toThrow(
        'Invalid or expired refresh token'
      );
    });
  });
});
