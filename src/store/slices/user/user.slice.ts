import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfileDto } from '@/services/users/types';

export type UserProfile = UserProfileDto;

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  /** Permissions fetched from GET /api/v1/rbac/me — keyed by org context */
  rbacPermissions: string[];
  /** True when at least one role from GET /api/v1/rbac/me has isSystemRole = true */
  rbacHasSystemRole: boolean;
  /** True once setRbacPermissions has been called at least once */
  rbacPermissionsLoaded: boolean;
}

const initialState: UserState = {
  profile: null,
  isLoading: true, // Initially loading until we verify auth state
  rbacPermissions: [],
  rbacHasSystemRole: false,
  rbacPermissionsLoaded: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
      state.isLoading = false;
    },
    clearProfile(state) {
      state.profile = null;
      state.isLoading = false;
      state.rbacPermissions = [];
      state.rbacHasSystemRole = false;
      state.rbacPermissionsLoaded = false;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setRbacPermissions(state, action: PayloadAction<string[]>) {
      state.rbacPermissions = action.payload;
      state.rbacPermissionsLoaded = true;
    },
    resetRbacPermissions(state) {
      state.rbacPermissions = [];
      state.rbacPermissionsLoaded = false;
    },
    setRbacHasSystemRole(state, action: PayloadAction<boolean>) {
      state.rbacHasSystemRole = action.payload;
    },
  },
});

export const {
  setProfile,
  clearProfile,
  setProfileLoading,
  setRbacPermissions,
  resetRbacPermissions,
  setRbacHasSystemRole,
} =
  userSlice.actions;
export const userReducer = userSlice.reducer;
