import { z } from 'zod';

const userValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name must be provided and must be a string',
      })
      .min(3)
      .max(50),

    email: z
      .string({
        required_error: 'Email must be provided and must be a string',
      })
      .email(),

    password: z
      .string({
        required_error: 'Password is required for your safety',
      })
      .max(20, { message: 'Password can not be more than 20 characters' }),
      
    role: z
      .enum(['user', 'admin', 'provider'], {
        required_error: 'Role must be provided',
      })
      .default('user'),

    // Optional fields
    phone: z
      .string()
      .regex(/^(\+?88)?01[3-9]\d{8}$/, 'Invalid phone number format')
      .optional(),

    address: z
      .string()
      .max(200, 'Address cannot be more than 200 characters')
      .optional(),

    city: z
      .string()
      .max(50, 'City name cannot be more than 50 characters')
      .optional(),

    profileImage: z
      .string()
      .url('Invalid profile image URL')
      .optional(),

    isBlocked: z
      .boolean()
      .default(false)
      .optional(),
  }),
});

export const UserValidation = {
  userValidationSchema,
};
