import { z } from 'zod';

// Define the Zod schema for creation
export const mealMenuValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
    portionSize: z.string().min(1, 'Portion size is required'),
    price: z.number().min(0, 'Price must be a positive number'),
    image: z.string().optional(),
    category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']),
    description: z.string().min(1, 'Description is required'),
    preparationTime: z.number().min(1, 'Preparation time must be at least 1 minute'),
    isAvailable: z.boolean(),
    nutritionalInfo: z.object({
      calories: z.number().min(0).optional(),
      protein: z.number().min(0).optional(),
      carbs: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
    }).optional(),
    customizationOptions: z.object({
      removeIngredients: z.array(z.string()).optional(),
      addOns: z.array(z.object({
        name: z.string(),
        price: z.number().min(0)
      })).optional(),
      spiceLevel: z.array(z.string()).optional(),
      noteToChef: z.boolean().optional()
    }).optional(),
  }),
});

// Define the Zod schema for updates (all fields are optional)
export const mealMenuUpdateValidationSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name is required').optional(),
      ingredients: z.array(z.string()).min(1, 'At least one ingredient is required').optional(),
      portionSize: z.string().min(1, 'Portion size is required').optional(),
      price: z.number().min(0, 'Price must be a positive number').optional(),
      image: z.string().optional(),
      category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']).optional(),
      description: z.string().min(1, 'Description is required').optional(),
      preparationTime: z.number().min(1, 'Preparation time must be at least 1 minute').optional(),
      isAvailable: z.boolean().optional(),
      nutritionalInfo: z.object({
        calories: z.number().min(0).optional(),
        protein: z.number().min(0).optional(),
        carbs: z.number().min(0).optional(),
        fat: z.number().min(0).optional(),
      }).optional(),
      customizationOptions: z.object({
        removeIngredients: z.array(z.string()).optional(),
        addOns: z.array(z.object({
          name: z.string(),
          price: z.number().min(0)
        })).optional(),
        spiceLevel: z.array(z.string()).optional(),
        noteToChef: z.boolean().optional()
      }).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
}); 