import client from './client';
import type { ApiResponse, ApiKey, CreateApiKeyRequest } from '../types';

export const apiKeysApi = {
  generateApiKey: async (payload: CreateApiKeyRequest): Promise<ApiKey> => {
    const mappedPayload = {
      name: payload.name,
      expires_at: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : undefined,
    };
    const { data } = await client.post<ApiResponse<ApiKey>>('/api-keys', mappedPayload);
    return data.data;
  },

  listApiKeys: async (): Promise<ApiKey[]> => {
    const { data } = await client.get<ApiResponse<ApiKey[]>>('/api-keys');
    return data.data;
  },

  revokeApiKey: async (id: string): Promise<void> => {
    await client.delete(`/api-keys/${id}`);
  },
};
export default apiKeysApi;
