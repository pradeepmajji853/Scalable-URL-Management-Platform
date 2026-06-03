import { Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { AuthRequest } from '../types';
import { successResponse, noContentResponse } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';

class UserController {
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password_hash: _, ...userWithoutPassword } = user;
      successResponse(res, userWithoutPassword, 'Profile fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, avatar_url } = req.body;

      if (name !== undefined && name.trim().length === 0) {
        throw new ValidationError('Name cannot be empty');
      }

      const updated = await userRepository.update(userId, { name, avatar_url });
      if (!updated) {
        throw new NotFoundError('User not found');
      }

      // Audit Log
      await auditLogRepository.create({
        user_id: userId,
        action: 'user.update_profile',
        entity_type: 'user',
        entity_id: userId,
        new_values: { name, avatar_url },
      });

      const { password_hash: _, ...userWithoutPassword } = updated;
      successResponse(res, userWithoutPassword, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const success = await userRepository.softDelete(userId);
      if (!success) {
        throw new NotFoundError('User not found or already deleted');
      }

      // Audit Log
      await auditLogRepository.create({
        user_id: userId,
        action: 'user.delete_account',
        entity_type: 'user',
        entity_id: userId,
      });

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
export default userController;
