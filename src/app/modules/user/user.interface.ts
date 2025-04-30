export const USER_ROLE = {
  admin: 'admin',
  provider: 'provider',
  customer: 'customer'
} as const;

export interface TUser {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: 'admin' | 'provider' | 'customer';
  isBlocked: boolean;
  
  // Optional fields
  city?: string;
  profileImage?: string;
  
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export type TUserRole = keyof typeof USER_ROLE;
