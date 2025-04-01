import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import accountReducer from './slices/accountSlice';
import transactionReducer from './slices/transactionSlice';
import reservationReducer from './slices/reservationSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import statementReducer from './slices/statementSlice';
import adminReportReducer from './slices/adminReportSlice';
import securityReducer from './slices/securitySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    transactions: transactionReducer,
    reservations: reservationReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    users: userReducer,
    settings: settingsReducer,
    statements: statementReducer,
    adminReports: adminReportReducer,
    security: securityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in the specified action types
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshToken/fulfilled'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
