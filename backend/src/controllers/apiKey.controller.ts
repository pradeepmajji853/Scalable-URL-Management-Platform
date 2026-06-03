import { Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKey.service';
import { AuthRequest, CreateApiKeyRequest } from '../types';
import { successResponse, createdResponse } from '../utils/response';

class ApiKeyController {
  generateApiKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data: CreateApiKeyRequest = req.body;
      const { apiKey, record } = await apiKeyService.generateApiKey(userId, data);

      // Return the unhashed key once, along with the record metadata
      createdResponse(res, {
        apiKey,
        id: record.id,
        name: record.name,
        key_prefix: record.key_prefix,
        scopes: record.scopes,
        expires_at: record.expires_at,
        created_at: record.created_at,
      }, 'API Key generated successfully');
    } catch (error) {
      next(error);
    }
  };

  listApiKeys = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const keys = await apiKeyService.listApiKeys(userId);
      successResponse(res, keys, 'API Keys listed successfully');
    } catch (error) {
      next(error);
    }
  };

  revokeApiKey = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await apiKeyService.revokeApiKey(id, userId);
      successResponse(res, null, 'API Key revoked successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const apiKeyController = new ApiKeyController();
export default apiKeyController;
