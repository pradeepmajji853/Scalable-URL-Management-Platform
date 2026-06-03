import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const changePasswordSchema = z.object({
  current_password: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  new_password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
