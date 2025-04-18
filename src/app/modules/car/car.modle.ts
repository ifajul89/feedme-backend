import { Schema, model } from 'mongoose';
import { TCar } from './car.interface';

// Create the Mongoose schema
const carSchema = new Schema<TCar>({
  name: { type: String, required: true },
  image: { type: String },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },

  category: {
    type: String,
    enum: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible'],
    required: true,
  },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  inStock: { type: Boolean, required: true },
});

// Create the Mongoose model
export const CarModel = model<TCar>('Car', carSchema);
