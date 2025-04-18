import { UserModel } from './user.model';
import { TUser } from './user.interface';

// 3. Get all user
const getAllUser = async () => {
  const result = await UserModel.find();
  return result;
};

// 3. Get a Specific user
const getSingleUser = async (id: string) => {
  const result = await UserModel.findById(id);
  return result;
};

// Update user information
const updateUser = async (id: string, payload: Partial<TUser>) => {
  // Don't allow role update through this endpoint
  delete payload.role;

  // Don't allow password updates through this regular update endpoint
  delete payload.password;

  // Create a copy of the payload to avoid modifying the original
  const updatedData = { ...payload };

  // NOTE: We've added middleware to handle password hashing in findOneAndUpdate
  // So we don't need to hash the password here anymore

  // Using $set operator explicitly to ensure middleware processes it correctly
  console.log('Updating user with data:', updatedData);

  // Update the user with the modified data
  const result = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: updatedData },
    { new: true, runValidators: true },
  );

  console.log('Updated user:', result);

  return result;
};

// Dedicated function for changing password
const changePassword = async (id: string, newPassword: string) => {
  // Using $set operator explicitly to ensure middleware processes it correctly
  console.log(`Changing password for user ID: ${id}`);

  // First check if the user exists
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    console.log(`changePassword service: User with ID ${id} not found`);
    throw new Error(`User with ID ${id} not found`);
  }

  console.log('User found, updating password');

  // Update only the password field
  const result = await UserModel.findOneAndUpdate(
    { _id: id },
    { $set: { password: newPassword } },
    { new: true },
  );

  if (!result) {
    console.log('Password update failed - user not found during update');
    throw new Error('Password update failed');
  }

  console.log('Password updated successfully');
  return result;
};

// Admin update user (including role changes)
const adminUpdateUser = async (id: string, payload: Partial<TUser>) => {
  console.log('Admin updating user with data:', payload);

  // Check if ID is valid MongoDB ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid ID format');
  }

  // First find the user by ID to check if they exist
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Check for email uniqueness only if email is in the payload and it's different
  if (payload.email && payload.email !== existingUser.email) {
    // Check if email is already used by another user
    const userWithEmail = await UserModel.findOne({
      email: payload.email,
      _id: { $ne: id },
    });

    if (userWithEmail) {
      throw new Error(`${payload.email} is already exists`);
    }
  }

  // If we reach here, validation passed - update the user
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  );

  return updatedUser;
};

// Delete a user (admin only)
const deleteUser = async (id: string) => {
  // Check if ID is valid MongoDB ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid ID format');
  }

  // First find the user by ID to check if they exist
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Delete the user
  const result = await UserModel.findByIdAndDelete(id);
  return result;
};

export const userService = {
  getSingleUser,
  getAllUser,
  updateUser,
  changePassword,
  adminUpdateUser,
  deleteUser,
};
