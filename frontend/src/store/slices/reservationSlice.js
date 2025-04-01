import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = '/api/reservations';

// Async thunk for fetching all reservations (admin)
export const fetchReservations = createAsyncThunk(
  'reservations/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reservations'
      );
    }
  }
);

// Async thunk for fetching user reservations (client)
export const fetchUserReservations = createAsyncThunk(
  'reservations/fetchUserReservations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/user`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user reservations'
      );
    }
  }
);

// Async thunk for fetching account reservations
export const fetchAccountReservations = createAsyncThunk(
  'reservations/fetchByAccount',
  async ({ accountId, params }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/account/${accountId}`, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch account reservations'
      );
    }
  }
);

// Async thunk for fetching a single reservation
export const fetchReservationById = createAsyncThunk(
  'reservations/fetchById',
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${reservationId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reservation details'
      );
    }
  }
);

// Async thunk for creating a reservation
export const createReservation = createAsyncThunk(
  'reservations/create',
  async (reservationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, reservationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create reservation'
      );
    }
  }
);

// Async thunk for updating a reservation
export const updateReservation = createAsyncThunk(
  'reservations/update',
  async ({ reservationId, reservationData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${reservationId}`, reservationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update reservation'
      );
    }
  }
);

// Async thunk for cancelling a reservation
export const cancelReservation = createAsyncThunk(
  'reservations/cancel',
  async ({ reservationId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${reservationId}/cancel`, { reason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel reservation'
      );
    }
  }
);

// Async thunk for confirming a reservation
export const confirmReservation = createAsyncThunk(
  'reservations/confirm',
  async ({ reservationId, confirmationData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${reservationId}/confirm`, confirmationData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to confirm reservation'
      );
    }
  }
);

// Initial state
const initialState = {
  reservations: [],
  userReservations: [],
  accountReservations: [],
  currentReservation: null,
  loading: false,
  error: null,
  totalReservations: 0,
  pagination: {
    page: 1,
    limit: 10,
  },
};

// Create reservation slice
const reservationSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearReservationError: (state) => {
      state.error = null;
    },
    setCurrentReservation: (state, action) => {
      state.currentReservation = action.payload;
    },
    clearCurrentReservation: (state) => {
      state.currentReservation = null;
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch all reservations
    builder.addCase(fetchReservations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReservations.fulfilled, (state, action) => {
      state.loading = false;
      state.reservations = action.payload.reservations;
      state.totalReservations = action.payload.total;
    });
    builder.addCase(fetchReservations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Fetch user reservations
    builder.addCase(fetchUserReservations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserReservations.fulfilled, (state, action) => {
      state.loading = false;
      state.userReservations = action.payload.reservations;
    });
    builder.addCase(fetchUserReservations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Fetch account reservations
    builder.addCase(fetchAccountReservations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAccountReservations.fulfilled, (state, action) => {
      state.loading = false;
      state.accountReservations = action.payload.reservations;
    });
    builder.addCase(fetchAccountReservations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Fetch reservation by ID
    builder.addCase(fetchReservationById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReservationById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReservation = action.payload;
    });
    builder.addCase(fetchReservationById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Create reservation
    builder.addCase(createReservation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createReservation.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReservation = action.payload;
      
      // Add to userReservations if it exists
      if (state.userReservations.length > 0) {
        state.userReservations.unshift(action.payload);
      }
    });
    builder.addCase(createReservation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Update reservation
    builder.addCase(updateReservation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateReservation.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReservation = action.payload;
      
      // Update in reservations array
      const index = state.reservations.findIndex(res => res._id === action.payload._id);
      if (index !== -1) {
        state.reservations[index] = action.payload;
      }
      
      // Update in userReservations array
      const userIndex = state.userReservations.findIndex(res => res._id === action.payload._id);
      if (userIndex !== -1) {
        state.userReservations[userIndex] = action.payload;
      }
      
      // Update in accountReservations array
      const accIndex = state.accountReservations.findIndex(res => res._id === action.payload._id);
      if (accIndex !== -1) {
        state.accountReservations[accIndex] = action.payload;
      }
    });
    builder.addCase(updateReservation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Cancel reservation
    builder.addCase(cancelReservation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelReservation.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReservation = action.payload;
      
      // Update in reservations array
      const index = state.reservations.findIndex(res => res._id === action.payload._id);
      if (index !== -1) {
        state.reservations[index] = action.payload;
      }
      
      // Update in userReservations array
      const userIndex = state.userReservations.findIndex(res => res._id === action.payload._id);
      if (userIndex !== -1) {
        state.userReservations[userIndex] = action.payload;
      }
      
      // Update in accountReservations array
      const accIndex = state.accountReservations.findIndex(res => res._id === action.payload._id);
      if (accIndex !== -1) {
        state.accountReservations[accIndex] = action.payload;
      }
    });
    builder.addCase(cancelReservation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Confirm reservation
    builder.addCase(confirmReservation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(confirmReservation.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReservation = action.payload;
      
      // Update in reservations array
      const index = state.reservations.findIndex(res => res._id === action.payload._id);
      if (index !== -1) {
        state.reservations[index] = action.payload;
      }
      
      // Update in userReservations array
      const userIndex = state.userReservations.findIndex(res => res._id === action.payload._id);
      if (userIndex !== -1) {
        state.userReservations[userIndex] = action.payload;
      }
      
      // Update in accountReservations array
      const accIndex = state.accountReservations.findIndex(res => res._id === action.payload._id);
      if (accIndex !== -1) {
        state.accountReservations[accIndex] = action.payload;
      }
    });
    builder.addCase(confirmReservation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { 
  clearReservationError, 
  setCurrentReservation, 
  clearCurrentReservation, 
  setPagination 
} = reservationSlice.actions;

export default reservationSlice.reducer;
