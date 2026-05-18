import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  tenantSlug: string | null;
  initialized: boolean;
}

const initialState: AppState = {
  tenantSlug: null,
  initialized: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTenantSlug: (state, action: PayloadAction<string | null>) => {
      state.tenantSlug = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    resetAppState: () => initialState,
  },
});

export const { setTenantSlug, setInitialized, resetAppState } = appSlice.actions;
export const appReducer = appSlice.reducer;
