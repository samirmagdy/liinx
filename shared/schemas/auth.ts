import { z } from 'zod';
import { signupIntentSchema } from '../contracts/templates.js';

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255, 'Email cannot exceed 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .refine(s => s.trim().length >= 8, 'Password cannot consist only of whitespace'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'),
  /** Catalog starter site applied in the same transaction that opens the account. */
  templateId: z.string().trim().min(1).max(60).optional(),
  /** Discipline picked at signup; files the account when no starter site supplies a category. */
  intent: signupIntentSchema.optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255, 'Email cannot exceed 255 characters'),
  password: z.string().min(1, 'Password is required').max(128, 'Password cannot exceed 128 characters')
});

export const resetRequestSchema = z.object({
  email: z.string().email().max(255)
});

export const resetConfirmSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(8).max(128).refine(s => s.trim().length >= 8)
});

export const deletionSchema = z.object({
  confirmation: z.literal('DELETE'),
  password: z.string().min(1, 'Current password is required').max(128, 'Password cannot exceed 128 characters')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password cannot exceed 128 characters')
    .refine(s => s.trim().length >= 8, 'Password cannot consist only of whitespace')
});

export const updateEmailSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255, 'Email cannot exceed 255 characters'),
  password: z.string().min(1, 'Password is required to change email')
});

export const updatePreferencesSchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
  timezone: z.string().max(100).optional(),
  emailNotifications: z.boolean().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>;
export type DeletionInput = z.infer<typeof deletionSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
