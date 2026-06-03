import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  verifyToken,
  hashString,
} from '../utils/helpers';
import { AuthTokens, TokenPayload, User } from '../types';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
  BadRequestError,
} from '../utils/errors';
import config from '../configs/index';
import { getClickQueue, getEmailQueue } from '../queues/index';
import logger from '../configs/logger';

class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);
    const verificationToken = generateRandomToken();

    // Create user
    const user = await userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      verification_token: verificationToken,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Send verification email (non-blocking)
    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add('send-verification', {
        to: user.email,
        subject: `Verify your ${config.app.name} account`,
        template: 'verification' as const,
        context: {
          name: user.name,
          verificationUrl: `${config.app.frontendUrl}/verify-email?token=${verificationToken}`,
        },
      });
    } catch (error) {
      logger.warn('Failed to queue verification email', { error: (error as Error).message });
    }

    // Audit log
    await auditLogRepository.create({
      user_id: user.id,
      action: 'user.register',
      entity_type: 'user',
      entity_id: user.id,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    meta?: { ip_address?: string; user_agent?: string }
  ): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, meta);

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Audit log
    await auditLogRepository.create({
      user_id: user.id,
      action: 'user.login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: meta?.ip_address,
      user_agent: meta?.user_agent,
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = hashString(refreshToken);
    await refreshTokenRepository.deleteByTokenHash(tokenHash);

    await auditLogRepository.create({
      user_id: userId,
      action: 'user.logout',
      entity_type: 'user',
      entity_id: userId,
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    oldRefreshToken: string
  ): Promise<AuthTokens> {
    const tokenHash = hashString(oldRefreshToken);
    const storedToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify the token is not expired
    if (new Date(storedToken.expires_at) < new Date()) {
      await refreshTokenRepository.deleteByTokenHash(tokenHash);
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Get user
    const user = await userRepository.findById(storedToken.user_id);
    if (!user || !user.is_active) {
      await refreshTokenRepository.deleteByTokenHash(tokenHash);
      throw new UnauthorizedError('User not found or deactivated');
    }

    // Delete old refresh token (rotation)
    await refreshTokenRepository.deleteByTokenHash(tokenHash);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await userRepository.verifyEmail(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await auditLogRepository.create({
      user_id: user.id,
      action: 'user.verify_email',
      entity_type: 'user',
      entity_id: user.id,
    });

    return user;
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);

    // Don't reveal if user exists
    if (!user || !user.is_active) {
      return;
    }

    const resetToken = generateRandomToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.setResetToken(user.id, hashString(resetToken), expires);

    // Send reset email
    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add('send-password-reset', {
        to: user.email,
        subject: `Reset your ${config.app.name} password`,
        template: 'password_reset' as const,
        context: {
          name: user.name,
          resetUrl: `${config.app.frontendUrl}/reset-password?token=${resetToken}`,
        },
      });
    } catch (error) {
      logger.warn('Failed to queue password reset email', { error: (error as Error).message });
    }

    await auditLogRepository.create({
      user_id: user.id,
      action: 'user.forgot_password',
      entity_type: 'user',
      entity_id: user.id,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashString(token);
    const user = await userRepository.findByResetToken(tokenHash);

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.clearResetToken(user.id);

    // Invalidate all refresh tokens for security
    await refreshTokenRepository.deleteByUserId(user.id);

    await auditLogRepository.create({
      user_id: user.id,
      action: 'user.reset_password',
      entity_type: 'user',
      entity_id: user.id,
    });
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);

    // Invalidate all refresh tokens
    await refreshTokenRepository.deleteByUserId(userId);

    await auditLogRepository.create({
      user_id: userId,
      action: 'user.change_password',
      entity_type: 'user',
      entity_id: userId,
    });
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ──── Private Helpers ──────────────────────────────────────────────────

  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    meta?: { ip_address?: string; user_agent?: string }
  ): Promise<void> {
    const tokenHash = hashString(refreshToken);
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);

    // Limit active sessions to 5
    const activeCount = await refreshTokenRepository.countByUserId(userId);
    if (activeCount >= 5) {
      // Remove oldest tokens
      await refreshTokenRepository.deleteByUserId(userId);
    }

    await refreshTokenRepository.create({
      user_id: userId,
      token_hash: tokenHash,
      user_agent: meta?.user_agent,
      ip_address: meta?.ip_address,
      expires_at: expiresAt,
    });
  }
}

export const authService = new AuthService();
