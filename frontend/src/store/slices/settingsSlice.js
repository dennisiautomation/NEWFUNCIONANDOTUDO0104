import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk para testar conexões com APIs
export const testApiConnections = createAsyncThunk(
  'settings/testApiConnections',
  async (_, { rejectWithValue }) => {
    try {
      const apis = [
        {
          name: 'Reservation',
          url: 'https://mytest.ftassetmanagement.com/api/Reservation.asp',
          params: {
            key: '6d9bac1b-f685-11ef-a3af-00155d010b18',
            account: '42226'
          }
        },
        {
          name: 'Reservation_confirmation',
          url: 'https://mytest.ftassetmanagement.com/api/Reservation_confirmation.asp',
          params: {
            key: '6d9bac1b-f685-11ef-a3af-00155d010b18'
          }
        },
        {
          name: 'Receiving',
          url: 'https://mytest.ftassetmanagement.com/api/receiving.asp',
          params: {
            key: '6d9bac1b-f685-11ef-a3af-00155d010b18'
          }
        },
        {
          name: 'Send',
          url: 'https://mytest.ftassetmanagement.com/api/send.asp',
          params: {
            key: '6d9bac1b-f685-11ef-a3af-00155d010b18'
          }
        }
      ];

      const results = await Promise.all(
        apis.map(async (api) => {
          const startTime = Date.now();
          try {
            await axios.get(api.url, { params: api.params });
            return {
              name: api.name,
              status: 'online',
              responseTime: Date.now() - startTime
            };
          } catch (error) {
            return {
              name: api.name,
              status: error.response?.status === 503 ? 'degraded' : 'offline',
              responseTime: Date.now() - startTime,
              error: error.message
            };
          }
        })
      );

      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para atualizar configurações do sistema
export const updateSystemSettings = createAsyncThunk(
  'settings/updateSystemSettings',
  async (settings, { rejectWithValue }) => {
    try {
      // Aqui você faria uma chamada à API para atualizar as configurações
      // Por enquanto, apenas simulamos um sucesso
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  apiStatus: [],
  settings: {
    security: {
      maxLoginAttempts: 3,
      sessionTimeout: 30, // minutos
      requireTwoFactor: true,
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSpecialChars: true,
        requireUppercase: true,
        expirationDays: 90
      }
    },
    transactions: {
      maxDailyLimit: {
        USD: 50000,
        EUR: 45000
      },
      requireApprovalAbove: {
        USD: 10000,
        EUR: 8500
      },
      allowedCurrencies: ['USD', 'EUR']
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: true,
      notifyOnLogin: true,
      notifyOnTransfer: true,
      notifyOnSecurityEvent: true
    },
    api: {
      refreshInterval: 5, // minutos
      timeoutThreshold: 5000, // ms
      retryAttempts: 3
    }
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // testApiConnections
      .addCase(testApiConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(testApiConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.apiStatus = action.payload;
      })
      .addCase(testApiConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // updateSystemSettings
      .addCase(updateSystemSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSystemSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = settingsSlice.actions;

export default settingsSlice.reducer;
