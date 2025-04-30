/* eslint-disable @typescript-eslint/no-this-alias */

import { model, Schema } from 'mongoose';
import { TUser } from './user.interface';
import bcrypt from 'bcrypt';
import config from '../../config';

const UserSchema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    // city: { type: String, required: true },
    // address: { type: String, required: true, default: "Dhaka,Bangladesh" },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'provider', 'customer'],
      default: 'customer',
    },
    isBlocked: { type: Boolean, default: false },

    // Optional fields
    city: { type: String },
    profileImage: { type: String },

    // Password reset fields
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function (next) {
  const user = this;
  // Only hash the password if it's modified (or new)
  if (!user.isModified('password')) return next();

  user.password = await bcrypt.hash(
    user.password,
    Number(config.BCRYPT_SALT_ROUNDS),
  );
  next();
});

// IMPORTANT: We need to implement a pre-hook for findOneAndUpdate to handle password hashing
// This is needed because findByIdAndUpdate bypasses the 'save' middleware
UserSchema.pre('findOneAndUpdate', async function (next) {
  // In Mongoose, this.getUpdate() might return either a simple object or an object with $set
  const update = this.getUpdate() as {
    password?: string;
    $set?: { password?: string };
  };

  // Check if the update contains a password directly or in $set
  if (update.password) {
    console.log('Hashing password in findOneAndUpdate middleware - direct');
    update.password = await bcrypt.hash(
      update.password,
      Number(config.BCRYPT_SALT_ROUNDS),
    );
  } else if (update.$set && update.$set.password) {
    console.log('Hashing password in findOneAndUpdate middleware - $set');
    update.$set.password = await bcrypt.hash(
      update.$set.password,
      Number(config.BCRYPT_SALT_ROUNDS),
    );
  }

  console.log('Update operation:', JSON.stringify(update));
  next();
});

UserSchema.post('save', async function (doc, next) {
  doc.password = '';
  next();
});

export const UserModel = model<TUser>('User', UserSchema);
