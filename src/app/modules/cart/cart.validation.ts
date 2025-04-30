import { z } from 'zod';

// For direct add to cart from meal customization UI
const addToCartValidationSchema = z.object({
  body: z.object({
    mealId: z.string(),
    mealName: z.string(),
    providerId: z.string(),
    providerName: z.string().optional(),
    providerEmail: z.string().email().optional(),
    customerEmail: z.string().email().optional(),
    price: z.number().min(0),
    quantity: z.number().min(1).optional().default(1),
    deliveryDate: z.string().or(z.date()),
    deliverySlot: z.string(),
    deliveryAddress: z.string(),
    // Customization options
    spiceLevel: z.string().optional(),
    removedIngredients: z.array(z.string()).optional().default([]),
    addOns: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
      })
    ).optional().default([]),
    specialInstructions: z.string().optional().default(''),
    // Handle typo in field name
    specialInstructionis: z.string().optional(),
  }),
});

// For updating items in the cart
const updateCartItemValidationSchema = z.object({
  body: z.object({
    quantity: z.number().min(1).optional(),
    spiceLevel: z.string().optional(),
    removedIngredients: z.array(z.string()).optional(),
    addOns: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
      })
    ).optional(),
    specialInstructions: z.string().optional(),
    // Handle typo in field name
    specialInstructionis: z.string().optional(),
  }),
});

export default {
  addToCartValidationSchema,
  updateCartItemValidationSchema,
}; 