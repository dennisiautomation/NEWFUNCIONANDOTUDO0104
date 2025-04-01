import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk para buscar todos os usuários (admin)
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/users', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar usuários'
      );
    }
  }
);

// Thunk para buscar preferências do usuário
export const fetchUserPreferences = createAsyncThunk(
  'user/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/user/preferences');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar preferências'
      );
    }
  }
);

// Thunk para atualizar preferências do usuário
export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/user/preferences', preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao atualizar preferências'
      );
    }
  }
);

// Thunk para atualizar configurações de segurança
export const updateSecuritySettings = createAsyncThunk(
  'user/updateSecurity',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/user/security', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao atualizar configurações de segurança'
      );
    }
  }
);

const initialState = {
  preferences: {
    darkMode: false,
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    twoFactorEnabled: false,
    sessionTimeout: 30, // minutos
    loginNotifications: true
  },
  loading: false,
  error: null,
  users: []
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setDarkMode: (state, action) => {
      state.preferences.darkMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchUserPreferences
      .addCase(fetchUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // updateUserPreferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // updateSecuritySettings
      .addCase(updateSecuritySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = {
          ...state.preferences,
          ...action.payload
        };
      })
      .addCase(updateSecuritySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setDarkMode, clearError } = userSlice.actions;
export default userSlice.reducer;
