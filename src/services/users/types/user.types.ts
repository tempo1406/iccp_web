/**
 * src/services/users/types/user.types.ts
 */

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string | null;
  permissions?: string[] | null;
  avatarUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  locale: 'en' | 'vi' | null;
  provider: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMyProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  locale?: 'en' | 'vi' | null;
}
