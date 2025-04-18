import { z } from 'zod';

// Define the Zod schema for creation
export const carValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    image: z.string().optional(),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1886, 'Year must be a valid number'),
    price: z.number().min(0, 'Price must be a positive number'),
    category: z.enum(['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible']),
    description: z.string().min(1, 'Description is required'),
    quantity: z
      .number()
      .int()
      .min(0, 'Quantity must be a non-negative integer'),
    inStock: z.boolean(),
  }),
});

// Define the Zod schema for updates (all fields are optional)
export const carUpdateValidationSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name is required').optional(),
      image: z.string().optional(),
      brand: z.string().min(1, 'Brand is required').optional(),
      model: z.string().min(1, 'Model is required').optional(),
      year: z
        .number()
        .int()
        .min(1886, 'Year must be a valid number')
        .optional(),
      price: z.number().min(0, 'Price must be a positive number').optional(),
      category: z
        .enum(['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible'])
        .optional(),
      description: z.string().min(1, 'Description is required').optional(),
      quantity: z
        .number()
        .int()
        .min(0, 'Quantity must be a non-negative integer')
        .optional(),
      inStock: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});
