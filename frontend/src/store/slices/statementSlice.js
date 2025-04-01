import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk para buscar o extrato de uma conta
export const fetchAccountStatement = createAsyncThunk(
  'statements/fetchAccountStatement',
  async ({ accountId, params = {} }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/statements/accounts/${accountId}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar extrato');
    }
  }
);

// Thunk para buscar o resumo financeiro
export const fetchFinancialSummary = createAsyncThunk(
  'statements/fetchFinancialSummary',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/statements/summary', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar resumo financeiro');
    }
  }
);

// Thunk para gerar o PDF do extrato
export const generateStatementPdf = createAsyncThunk(
  'statements/generateStatementPdf',
  async ({ accountId, params = {} }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        url: `/api/statements/accounts/${accountId}/pdf`,
        method: 'GET',
        responseType: 'blob',
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Criar URL para o blob e iniciar download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_${accountId}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao gerar PDF');
    }
  }
);

const statementSlice = createSlice({
  name: 'statements',
  initialState: {
    accountStatement: null,
    financialSummary: null,
    loading: false,
    pdfLoading: false,
    error: null
  },
  reducers: {
    clearStatementData: (state) => {
      state.accountStatement = null;
      state.error = null;
    },
    clearFinancialSummary: (state) => {
      state.financialSummary = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Casos para fetchAccountStatement
      .addCase(fetchAccountStatement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountStatement.fulfilled, (state, action) => {
        state.loading = false;
        state.accountStatement = action.payload;
      })
      .addCase(fetchAccountStatement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Casos para fetchFinancialSummary
      .addCase(fetchFinancialSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinancialSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.financialSummary = action.payload;
      })
      .addCase(fetchFinancialSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Casos para generateStatementPdf
      .addCase(generateStatementPdf.pending, (state) => {
        state.pdfLoading = true;
        state.error = null;
      })
      .addCase(generateStatementPdf.fulfilled, (state) => {
        state.pdfLoading = false;
      })
      .addCase(generateStatementPdf.rejected, (state, action) => {
        state.pdfLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearStatementData, clearFinancialSummary } = statementSlice.actions;

export default statementSlice.reducer;
