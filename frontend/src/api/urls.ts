import client from './client';
import type { ApiResponse, Url, CreateUrlRequest, UpdateUrlRequest, PaginatedResponse, PaginationParams, ApiPaginatedResponse } from '../types';

function mapUrl(dbUrl: any): Url {
  return {
    id: dbUrl.id,
    originalUrl: dbUrl.original_url || '',
    shortCode: dbUrl.short_code || '',
    shortUrl: `${window.location.origin}/r/${dbUrl.short_code}`,
    title: dbUrl.title || undefined,
    description: dbUrl.description || undefined,
    customAlias: dbUrl.custom_alias || undefined,
    password: dbUrl.password_hash || undefined,
    expiresAt: dbUrl.expires_at || undefined,
    isActive: dbUrl.is_active !== false,
    clickCount: Number(dbUrl.click_count || 0),
    userId: dbUrl.user_id || '',
    teamId: dbUrl.team_id || undefined,
    tags: dbUrl.tags || undefined,
    createdAt: dbUrl.created_at || '',
    updatedAt: dbUrl.updated_at || '',
    deletedAt: dbUrl.deleted_at || undefined,
  };
}

export const urlsApi = {
  createUrl: async (payload: CreateUrlRequest): Promise<Url> => {
    const mappedPayload = {
      original_url: payload.originalUrl,
      custom_alias: payload.customAlias,
      title: payload.title,
      description: payload.description,
      expires_at: payload.expiresAt,
      password: payload.password,
      tags: payload.tags,
    };
    const { data } = await client.post<ApiResponse<any>>('/urls', mappedPayload);
    return mapUrl(data.data);
  },

  getUrls: async (params?: PaginationParams): Promise<PaginatedResponse<Url>> => {
    const mappedParams: any = {};
    if (params) {
      if (params.page) mappedParams.page = String(params.page);
      if (params.limit) mappedParams.limit = String(params.limit);
      if (params.search) mappedParams.search = params.search;
      if (params.sort) {
        mappedParams.sortBy = params.sort === 'createdAt' ? 'created_at' : params.sort === 'clickCount' ? 'click_count' : params.sort;
      }
      if (params.order) mappedParams.sortOrder = params.order.toUpperCase();
    }
    
    const { data } = await client.get<ApiPaginatedResponse<any>>('/urls', { params: mappedParams });
    
    return {
      data: (data.data || []).map(mapUrl),
      pagination: {
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
        hasNext: data.pagination?.hasNext || false,
        hasPrev: data.pagination?.hasPrev || false,
      }
    };
  },

  getUrl: async (id: string): Promise<Url> => {
    const { data } = await client.get<ApiResponse<any>>(`/urls/${id}`);
    return mapUrl(data.data);
  },

  updateUrl: async (id: string, payload: UpdateUrlRequest): Promise<Url> => {
    const mappedPayload = {
      original_url: payload.originalUrl,
      title: payload.title,
      description: payload.description,
      expires_at: payload.expiresAt,
      password: payload.password,
      is_active: payload.isActive,
      tags: payload.tags,
    };
    const { data } = await client.put<ApiResponse<any>>(`/urls/${id}`, mappedPayload);
    return mapUrl(data.data);
  },

  deleteUrl: async (id: string): Promise<void> => {
    await client.delete(`/urls/${id}`);
  },

  restoreUrl: async (id: string): Promise<Url> => {
    const { data } = await client.post<ApiResponse<any>>(`/urls/${id}/restore`);
    return mapUrl(data.data);
  },

  getQrCode: async (shortCode: string): Promise<string> => {
    const { data } = await client.get<ApiResponse<{ qrCode: string }>>(`/urls/${shortCode}/qr`);
    return data.data.qrCode;
  },
};
export default urlsApi;
