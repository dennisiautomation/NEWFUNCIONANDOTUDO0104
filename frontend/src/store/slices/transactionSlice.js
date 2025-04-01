import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = '/api/transactions';

// Buscar transações do usuário
export const fetchUserTransactions = createAsyncThunk(
  'transactions/fetchUserTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/user`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar transações'
      );
    }
  }
);

// Buscar todas as transações (para admin)
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar transações'
      );
    }
  }
);

// Buscar transações de uma conta específica
export const fetchAccountTransactions = createAsyncThunk(
  'transactions/fetchAccountTransactions',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/account/${accountId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar transações da conta'
      );
    }
  }
);

// Buscar detalhes de uma transação
export const fetchTransactionDetails = createAsyncThunk(
  'transactions/fetchDetails',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${transactionId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar detalhes da transação'
      );
    }
  }
);

// Iniciar uma nova transferência
export const initiateTransfer = createAsyncThunk(
  'transactions/initiateTransfer',
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/transfer`, transferData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao iniciar transferência'
      );
    }
  }
);

// Executar uma transferência (confirmar)
export const executeTransfer = createAsyncThunk(
  'transactions/executeTransfer',
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/execute`, transferData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao executar transferência'
      );
    }
  }
);

// Iniciar uma nova reserva
export const initiateReservation = createAsyncThunk(
  'transactions/initiateReservation',
  async (reservationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/reservation`, reservationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao iniciar reserva'
      );
    }
  }
);

// Confirmar uma reserva
export const confirmReservation = createAsyncThunk(
  'transactions/confirmReservation',
  async (confirmationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/confirmation`, confirmationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao confirmar reserva'
      );
    }
  }
);

// Confirmar uma transação
export const confirmTransaction = createAsyncThunk(
  'transactions/confirmTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${transactionId}/confirm`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao confirmar transação'
      );
    }
  }
);

// Cancelar uma transação
export const cancelTransaction = createAsyncThunk(
  'transactions/cancelTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${transactionId}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao cancelar transação'
      );
    }
  }
);

// Estado inicial
const initialState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,
  transferStatus: 'idle', // 'idle', 'pending', 'success', 'error'
  reservationStatus: 'idle',
  confirmationStatus: 'idle',
  transactionStatus: 'idle', // 'idle', 'pending', 'success', 'error'
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Slice de transações
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactionError: (state) => {
      state.error = null;
    },
    resetTransferStatus: (state) => {
      state.transferStatus = 'idle';
    },
    resetReservationStatus: (state) => {
      state.reservationStatus = 'idle';
    },
    resetConfirmationStatus: (state) => {
      state.confirmationStatus = 'idle';
    },
    resetTransactionStatus: (state) => {
      state.transactionStatus = 'idle';
    },
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload;
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
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
      // Fetch User Transactions
      .addCase(fetchUserTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        
        // Update pagination if provided
        if (action.meta?.arg?.page) {
          state.pagination.page = action.meta.arg.page;
        }
        if (action.meta?.arg?.limit) {
          state.pagination.limit = action.meta.arg.limit;
        }
      })
      .addCase(fetchUserTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch All Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        
        // Update pagination if provided
        if (action.meta?.arg?.page) {
          state.pagination.page = action.meta.arg.page;
        }
        if (action.meta?.arg?.limit) {
          state.pagination.limit = action.meta.arg.limit;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Account Transactions
      .addCase(fetchAccountTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        
        // Update pagination if provided
        if (action.meta?.arg?.page) {
          state.pagination.page = action.meta.arg.page;
        }
        if (action.meta?.arg?.limit) {
          state.pagination.limit = action.meta.arg.limit;
        }
      })
      .addCase(fetchAccountTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Transaction Details
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Initiate Transfer
      .addCase(initiateTransfer.pending, (state) => {
        state.transferStatus = 'pending';
        state.error = null;
      })
      .addCase(initiateTransfer.fulfilled, (state, action) => {
        state.transferStatus = 'success';
        // Add the new transaction to the top of the list
        state.transactions = [action.payload, ...state.transactions];
        state.currentTransaction = action.payload;
      })
      .addCase(initiateTransfer.rejected, (state, action) => {
        state.transferStatus = 'error';
        state.error = action.payload;
      })
      
      // Execute Transfer
      .addCase(executeTransfer.pending, (state) => {
        state.transferStatus = 'pending';
        state.error = null;
      })
      .addCase(executeTransfer.fulfilled, (state, action) => {
        state.transferStatus = 'success';
        // Update the transaction status
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        // Update current transaction if it's the one being executed
        if (state.currentTransaction && state.currentTransaction._id === action.payload._id) {
          state.currentTransaction = action.payload;
        }
      })
      .addCase(executeTransfer.rejected, (state, action) => {
        state.transferStatus = 'error';
        state.error = action.payload;
      })
      
      // Initiate Reservation
      .addCase(initiateReservation.pending, (state) => {
        state.reservationStatus = 'pending';
        state.error = null;
      })
      .addCase(initiateReservation.fulfilled, (state, action) => {
        state.reservationStatus = 'success';
        // Add the new reservation to the top of the list
        state.transactions = [action.payload, ...state.transactions];
        state.currentTransaction = action.payload;
      })
      .addCase(initiateReservation.rejected, (state, action) => {
        state.reservationStatus = 'error';
        state.error = action.payload;
      })
      
      // Confirm Reservation
      .addCase(confirmReservation.pending, (state) => {
        state.confirmationStatus = 'pending';
        state.error = null;
      })
      .addCase(confirmReservation.fulfilled, (state, action) => {
        state.confirmationStatus = 'success';
        
        // Update the transaction status
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        // Update current transaction if it's the one being confirmed
        if (state.currentTransaction && state.currentTransaction._id === action.payload._id) {
          state.currentTransaction = action.payload;
        }
      })
      .addCase(confirmReservation.rejected, (state, action) => {
        state.confirmationStatus = 'error';
        state.error = action.payload;
      })
      
      // Confirm Transaction
      .addCase(confirmTransaction.pending, (state) => {
        state.transactionStatus = 'pending';
        state.error = null;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        state.transactionStatus = 'success';
        
        // Update the transaction status
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        // Update current transaction if it's the one being confirmed
        if (state.currentTransaction && state.currentTransaction._id === action.payload._id) {
          state.currentTransaction = action.payload;
        }
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.transactionStatus = 'error';
        state.error = action.payload;
      })
      
      // Cancel Transaction
      .addCase(cancelTransaction.pending, (state) => {
        state.transactionStatus = 'pending';
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        state.transactionStatus = 'success';
        
        // Update the transaction status
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        
        // Update current transaction if it's the one being canceled
        if (state.currentTransaction && state.currentTransaction._id === action.payload._id) {
          state.currentTransaction = action.payload;
        }
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.transactionStatus = 'error';
        state.error = action.payload;
      });
  }
});

// Exportar ações e reducer
export const { 
  clearTransactionError, 
  resetTransferStatus, 
  resetReservationStatus, 
  resetConfirmationStatus,
  resetTransactionStatus,
  setCurrentTransaction,
  clearCurrentTransaction,
  setPagination
} = transactionSlice.actions;

export default transactionSlice.reducer;
