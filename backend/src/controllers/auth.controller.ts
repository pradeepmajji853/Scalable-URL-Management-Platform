import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types';
import { successResponse, createdResponse } from '../utils/response';
import { extractClientIp } from '../utils/helpers';
import config from '../configs/index';

class AuthController {
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax', // Use lax for OAuth/cross-site redirection redirects if any, strict is fine too
      maxAge: config.jwt.refreshExpiryMs,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
    });
  }

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: RegisterRequest = req.body;
      const result = await authService.register(data);

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      createdResponse(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
      }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: LoginRequest = req.body;
      const ip = extractClientIp(req.headers, req.socket.remoteAddress);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await authService.login(data.email, data.password, {
        ip_address: ip,
        user_agent: userAgent,
      });

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      successResponse(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
      }, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const userId = req.user?.id;

      if (refreshToken && userId) {
        await authService.logout(refreshToken, userId);
      }

      this.clearRefreshTokenCookie(res);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!oldRefreshToken) {
        res.status(401).json({ success: false, message: 'Refresh token is required' });
        return;
      }

      const tokens = await authService.refreshToken(oldRefreshToken);

      this.setRefreshTokenCookie(res, tokens.refreshToken);

      successResponse(res, {
        accessToken: tokens.accessToken,
      }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ success: false, message: 'Verification token is required' });
        return;
      }

      await authService.verifyEmail(token);
      successResponse(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email }: ForgotPasswordRequest = req.body;
      await authService.forgotPassword(email);
      successResponse(res, null, 'If your email is registered, we have sent a reset password link');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password }: ResetPasswordRequest = req.body;
      await authService.resetPassword(token, password);
      successResponse(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { current_password, new_password }: ChangePasswordRequest = req.body;
      await authService.changePassword(userId, current_password, new_password);
      successResponse(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await authService.getMe(userId);
      successResponse(res, user, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
export default authController;
