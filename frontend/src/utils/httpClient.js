import axios from 'axios';
import store from '../store';
import { refreshToken, logout, setSessionExpired } from '../store/slices/authSlice';
import { showErrorAlert } from '../store/slices/uiSlice';

// Create axios instance with default config
const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to token expiration (401 Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark to prevent infinite loops
      
      try {
        // Try to refresh the token
        await store.dispatch(refreshToken()).unwrap();
        
        // Get the new token after refresh
        const newToken = store.getState().auth.token;
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retry the original request with new token
        return httpClient(originalRequest);
      } catch (refreshError) {
        // If refresh failed, logout and set session expired flag
        store.dispatch(setSessionExpired(true));
        store.dispatch(logout());
        
        // Show error alert
        store.dispatch(showErrorAlert('Your session has expired. Please login again.'));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other API errors
    if (error.response && error.response.data && error.response.data.message) {
      // Show error message from API
      store.dispatch(showErrorAlert(error.response.data.message));
    } else if (error.message) {
      // Show generic error message
      store.dispatch(showErrorAlert(
        error.message === 'Network Error' 
          ? 'Unable to connect to the server. Please check your internet connection.'
          : `Error: ${error.message}`
      ));
    } else {
      // Show fallback error message
      store.dispatch(showErrorAlert('An unexpected error occurred.'));
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;
