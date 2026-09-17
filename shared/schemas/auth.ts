import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255, 'Email cannot exceed 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .refine(s => s.trim().length >= 8, 'Password cannot consist only of whitespace'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores')
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
  confirmation: z.literal('DELETE')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>;
export type DeletionInput = z.infer<typeof deletionSchema>;
