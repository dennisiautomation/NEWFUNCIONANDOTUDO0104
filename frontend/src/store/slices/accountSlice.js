import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = '/api/accounts';

// Async thunk for fetching all accounts (admin only)
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch accounts'
      );
    }
  }
);

// Async thunk for fetching user accounts (client)
export const fetchUserAccounts = createAsyncThunk(
  'accounts/fetchUserAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/user`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user accounts'
      );
    }
  }
);

// Async thunk for fetching a single account by ID
export const fetchAccountById = createAsyncThunk(
  'accounts/fetchById',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${accountId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch account'
      );
    }
  }
);

// Async thunk for creating a new account (admin only)
export const createAccount = createAsyncThunk(
  'accounts/create',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, accountData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create account'
      );
    }
  }
);

// Async thunk for updating an account (admin only)
export const updateAccount = createAsyncThunk(
  'accounts/update',
  async ({ accountId, accountData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${accountId}`, accountData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update account'
      );
    }
  }
);

// Async thunk for updating account status (activate/deactivate)
export const updateAccountStatus = createAsyncThunk(
  'accounts/updateStatus',
  async ({ accountId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/${accountId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update account status'
      );
    }
  }
);

// Initial state
const initialState = {
  accounts: [],
  userAccounts: [],
  currentAccount: null,
  loading: false,
  error: null,
  totalAccounts: 0,
  pagination: {
    page: 1,
    limit: 10,
  },
};

// Create account slice
const accountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    clearAccountError: (state) => {
      state.error = null;
    },
    setCurrentAccount: (state, action) => {
      state.currentAccount = action.payload;
    },
    clearCurrentAccount: (state) => {
      state.currentAccount = null;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch all accounts (admin)
    builder.addCase(fetchAccounts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAccounts.fulfilled, (state, action) => {
      state.loading = false;
      state.accounts = action.payload.accounts;
      state.totalAccounts = action.payload.total;
    });
    builder.addCase(fetchAccounts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Fetch user accounts (client)
    builder.addCase(fetchUserAccounts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserAccounts.fulfilled, (state, action) => {
      state.loading = false;
      state.userAccounts = action.payload;
    });
    builder.addCase(fetchUserAccounts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Fetch account by ID
    builder.addCase(fetchAccountById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAccountById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentAccount = action.payload;
    });
    builder.addCase(fetchAccountById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Create account
    builder.addCase(createAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createAccount.fulfilled, (state, action) => {
      state.loading = false;
      state.accounts.push(action.payload);
      state.totalAccounts += 1;
    });
    builder.addCase(createAccount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Update account
    builder.addCase(updateAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateAccount.fulfilled, (state, action) => {
      state.loading = false;
      
      // Update in accounts array
      const index = state.accounts.findIndex(account => account._id === action.payload._id);
      if (index !== -1) {
        state.accounts[index] = action.payload;
      }
      
      // Update in userAccounts array if present
      const userIndex = state.userAccounts.findIndex(account => account._id === action.payload._id);
      if (userIndex !== -1) {
        state.userAccounts[userIndex] = action.payload;
      }
      
      // Update currentAccount if it's the same
      if (state.currentAccount && state.currentAccount._id === action.payload._id) {
        state.currentAccount = action.payload;
      }
    });
    builder.addCase(updateAccount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Update account status
    builder.addCase(updateAccountStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateAccountStatus.fulfilled, (state, action) => {
      state.loading = false;
      
      // Update in accounts array
      const index = state.accounts.findIndex(account => account._id === action.payload._id);
      if (index !== -1) {
        state.accounts[index] = action.payload;
      }
      
      // Update in userAccounts array if present
      const userIndex = state.userAccounts.findIndex(account => account._id === action.payload._id);
      if (userIndex !== -1) {
        state.userAccounts[userIndex] = action.payload;
      }
      
      // Update currentAccount if it's the same
      if (state.currentAccount && state.currentAccount._id === action.payload._id) {
        state.currentAccount = action.payload;
      }
    });
    builder.addCase(updateAccountStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { 
  clearAccountError, 
  setCurrentAccount, 
  clearCurrentAccount, 
  setPagination 
} = accountSlice.actions;

export default accountSlice.reducer;
