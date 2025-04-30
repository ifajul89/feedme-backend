export type MealTypes = {
  TMealMenu: {
    name: string;
    providerId: string | { _id: string; name: string; email: string };
    ingredients: string[];
    portionSize: string;
    price: number;
    image?: string;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
    description: string;
    preparationTime: number; // in minutes
    isAvailable: boolean;
    quantity: number; // Available quantity of the meal
    ratings?: {
      average: number; // Average rating (1-5)
      count: number; // Number of ratings
      reviews?: Array<{
        userId: string;
        rating: number;
        comment?: string;
        date: Date;
        customerName?: string;
      }>;
    };
    nutritionalInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
    customizationOptions?: {
      removeIngredients?: string[];
      addOns?: Array<{
        name: string;
        price: number;
      }>;
      spiceLevel?: string[];
      noteToChef?: boolean;
    };
  };

  TMealCustomization: {
    quantity: number;
    specialInstructions?: string;
    preferences?: {
      spiceLevel?: string;
      allergies?: string[];
      dietaryRestrictions?: string[];
      extraIngredients?: string[];
      removeIngredients?: string[];
    };
  };
};
