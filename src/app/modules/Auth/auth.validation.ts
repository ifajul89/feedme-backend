import { z } from 'zod';

const loginValidation = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required.' }).email(),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refresh_token: z.string({ required_error: 'Refresh is required.' }),
  }),
});

const forgotPasswordValidation = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required.' }).email(),
  }),
});

const resetPasswordValidation = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token is required.' }),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
  }),
});

export const authValidation = { 
  loginValidation, 
  refreshTokenValidationSchema,
  forgotPasswordValidation,
  resetPasswordValidation
};
