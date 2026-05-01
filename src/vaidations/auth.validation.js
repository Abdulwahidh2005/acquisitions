import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must is required').max(225).trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128)
    .trim(),
  role: z.enum(['user', 'admin']).default('user'),
});

export const signInSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128)
    .trim(),
});
