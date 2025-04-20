export type MealTypes = {
  TMealMenu: {
    name: string;
    providerId: string;
    ingredients: string[];
    portionSize: string;
    price: number;
    image?: string;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
    description: string;
    preparationTime: number; // in minutes
    isAvailable: boolean;
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
      spiceLevel?: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
      allergies?: string[];
      dietaryRestrictions?: string[];
      extraIngredients?: string[];
      removeIngredients?: string[];
    };
  };
};

 
