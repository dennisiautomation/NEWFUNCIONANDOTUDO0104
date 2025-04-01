import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = '/api/security';

// Async thunk para buscar logs de segurança do usuário
export const fetchSecurityLogs = createAsyncThunk(
  'security/fetchLogs',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/user`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar registros de segurança'
      );
    }
  }
);

// Async thunk para buscar logs de segurança detalhados
export const fetchSecurityLogDetails = createAsyncThunk(
  'security/fetchLogDetails',
  async (logId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/logs/${logId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar detalhes do registro'
      );
    }
  }
);

// Estado inicial
const initialState = {
  logs: [],
  currentLog: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Slice de segurança
const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearSecurityError: (state) => {
      state.error = null;
    },
    setCurrentLog: (state, action) => {
      state.currentLog = action.payload;
    },
    clearCurrentLog: (state) => {
      state.currentLog = null;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Security Logs
      .addCase(fetchSecurityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload || [];
        
        // Se a resposta incluir dados de paginação
        if (action.meta?.arg?.pagination) {
          state.pagination = action.meta.arg.pagination;
        }
      })
      .addCase(fetchSecurityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Erro ao buscar registros de segurança';
      })
      
      // Fetch Security Log Details
      .addCase(fetchSecurityLogDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurityLogDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLog = action.payload;
      })
      .addCase(fetchSecurityLogDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Erro ao buscar detalhes do registro';
      });
  }
});

// Exportar ações e reducer
export const { 
  clearSecurityError, 
  setCurrentLog, 
  clearCurrentLog, 
  setPagination 
} = securitySlice.actions;

export default securitySlice.reducer;
