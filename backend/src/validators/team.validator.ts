import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .min(2, 'Team name must be at least 2 characters')
    .max(255, 'Team name must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  role: z
    .enum(['admin', 'member', 'viewer'], {
      errorMap: () => ({ message: 'Role must be admin, member, or viewer' }),
    })
    .optional()
    .default('member'),
});

export const updateRoleSchema = z.object({
  role: z
    .enum(['admin', 'member', 'viewer'], {
      errorMap: () => ({ message: 'Role must be admin, member, or viewer' }),
    }),
});

export const teamParamsSchema = z.object({
  id: z.string().uuid('Invalid team ID format'),
});

export const teamMemberParamsSchema = z.object({
  id: z.string().uuid('Invalid team ID format'),
  userId: z.string().uuid('Invalid user ID format'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
