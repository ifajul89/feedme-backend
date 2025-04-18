export type TMealMenu = {
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
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}; 