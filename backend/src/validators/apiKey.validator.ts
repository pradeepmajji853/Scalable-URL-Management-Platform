import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z
    .string({ required_error: 'API Key name is required' })
    .min(1, 'API Key name is required')
    .max(100, 'API Key name must be less than 100 characters')
    .trim(),
  scopes: z
    .array(z.string())
    .optional(),
  expires_at: z
    .string()
    .datetime({ message: 'Invalid datetime format' })
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
