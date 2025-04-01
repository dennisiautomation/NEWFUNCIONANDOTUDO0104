import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunks para relatórios de transações
export const fetchTransactionReport = createAsyncThunk(
  'adminReports/fetchTransactionReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin-reports/transactions', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar relatório de transações');
    }
  }
);

export const generateTransactionPdf = createAsyncThunk(
  'adminReports/generateTransactionPdf',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        url: '/api/admin-reports/transactions/pdf',
        method: 'GET',
        responseType: 'blob',
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transacoes_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      link.remove();
      
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao gerar PDF de transações');
    }
  }
);

// Thunks para relatórios de contas
export const fetchAccountReport = createAsyncThunk(
  'adminReports/fetchAccountReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin-reports/accounts', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar relatório de contas');
    }
  }
);

// Thunks para dashboard administrativo
export const fetchDashboardStats = createAsyncThunk(
  'adminReports/fetchDashboardStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin-reports/dashboard', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar estatísticas do dashboard');
    }
  }
);

const initialState = {
  transactions: {
    data: [],
    pagination: {
      page: 0,
      limit: 10,
      total: 0
    },
    loading: false,
    pdfLoading: false,
    error: null
  },
  accounts: {
    data: [],
    pagination: {
      page: 0,
      limit: 10,
      total: 0
    },
    loading: false,
    error: null
  },
  dashboard: {
    data: null,
    loading: false,
    error: null
  }
};

const adminReportSlice = createSlice({
  name: 'adminReports',
  initialState,
  reducers: {
    setTransactionPage: (state, action) => {
      state.transactions.pagination.page = action.payload;
    },
    setTransactionLimit: (state, action) => {
      state.transactions.pagination.limit = action.payload;
      state.transactions.pagination.page = 0;
    },
    setAccountPage: (state, action) => {
      state.accounts.pagination.page = action.payload;
    },
    setAccountLimit: (state, action) => {
      state.accounts.pagination.limit = action.payload;
      state.accounts.pagination.page = 0;
    },
    clearTransactionError: (state) => {
      state.transactions.error = null;
    },
    clearAccountError: (state) => {
      state.accounts.error = null;
    },
    clearDashboardError: (state) => {
      state.dashboard.error = null;
    }
  },
  extraReducers: (builder) => {
    // Relatório de Transações
    builder
      .addCase(fetchTransactionReport.pending, (state) => {
        state.transactions.loading = true;
        state.transactions.error = null;
      })
      .addCase(fetchTransactionReport.fulfilled, (state, action) => {
        state.transactions.loading = false;
        state.transactions.data = action.payload.transactions;
        state.transactions.pagination.total = action.payload.pagination.total;
      })
      .addCase(fetchTransactionReport.rejected, (state, action) => {
        state.transactions.loading = false;
        state.transactions.error = action.payload || 'Erro ao buscar relatório de transações';
      });
    
    // Geração de PDF de Transações
    builder
      .addCase(generateTransactionPdf.pending, (state) => {
        state.transactions.pdfLoading = true;
        state.transactions.error = null;
      })
      .addCase(generateTransactionPdf.fulfilled, (state) => {
        state.transactions.pdfLoading = false;
      })
      .addCase(generateTransactionPdf.rejected, (state, action) => {
        state.transactions.pdfLoading = false;
        state.transactions.error = action.payload || 'Erro ao gerar PDF de transações';
      });
    
    // Relatório de Contas
    builder
      .addCase(fetchAccountReport.pending, (state) => {
        state.accounts.loading = true;
        state.accounts.error = null;
      })
      .addCase(fetchAccountReport.fulfilled, (state, action) => {
        state.accounts.loading = false;
        state.accounts.data = action.payload.accounts;
        state.accounts.pagination.total = action.payload.pagination.total;
      })
      .addCase(fetchAccountReport.rejected, (state, action) => {
        state.accounts.loading = false;
        state.accounts.error = action.payload || 'Erro ao buscar relatório de contas';
      });
    
    // Dashboard Administrativo
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.data = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload || 'Erro ao buscar estatísticas do dashboard';
      });
  }
});

export const {
  setTransactionPage,
  setTransactionLimit,
  setAccountPage,
  setAccountLimit,
  clearTransactionError,
  clearAccountError,
  clearDashboardError
} = adminReportSlice.actions;

export default adminReportSlice.reducer;
