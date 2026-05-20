import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './slices/app/app-slice';
import { authReducer } from './slices/auth/auth.slice';
import { userReducer } from './slices/user/user.slice';
import { notificationReducer } from './slices/notification/notification.slice';

export const makeStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      auth: authReducer,
      user: userReducer,
      notification: notificationReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export * from './hooks';
export * from './slices/app/app-slice';
export * from './slices/notification/notification.slice';
