import { z } from 'zod';

export const createUrlSchema = z.object({
  original_url: z
    .string({ required_error: 'Original URL is required' })
    .url('Invalid URL format')
    .max(2048, 'URL must be less than 2048 characters'),
  custom_alias: z
    .string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(50, 'Custom alias must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  title: z
    .string()
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  expires_at: z
    .string()
    .datetime({ message: 'Invalid datetime format' })
    .optional(),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(128, 'Password must be less than 128 characters')
    .optional(),
  max_clicks: z
    .number()
    .int('Max clicks must be an integer')
    .positive('Max clicks must be positive')
    .optional(),
});

export const updateUrlSchema = z.object({
  original_url: z
    .string()
    .url('Invalid URL format')
    .max(2048, 'URL must be less than 2048 characters')
    .optional(),
  title: z
    .string()
    .max(255, 'Title must be less than 255 characters')
    .nullable()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(10)
    .nullable()
    .optional(),
  expires_at: z
    .string()
    .datetime({ message: 'Invalid datetime format' })
    .nullable()
    .optional(),
  password: z
    .string()
    .min(4)
    .max(128)
    .nullable()
    .optional(),
  max_clicks: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  is_active: z
    .boolean()
    .optional(),
});

export const urlParamsSchema = z.object({
  id: z
    .string()
    .uuid('Invalid URL ID format'),
});

export const urlQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  search: z
    .string()
    .max(255)
    .optional(),
  sort_by: z
    .enum(['created_at', 'click_count', 'title', 'updated_at'])
    .optional()
    .default('created_at'),
  sort_order: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .optional()
    .default('DESC')
    .transform((val) => val.toUpperCase() as 'ASC' | 'DESC'),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;
export type UrlParamsInput = z.infer<typeof urlParamsSchema>;
export type UrlQueryInput = z.infer<typeof urlQuerySchema>;
