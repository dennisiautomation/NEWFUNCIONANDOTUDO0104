import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  sidebar: {
    open: true,
    variant: 'persistent', // 'persistent', 'temporary', or 'permanent'
  },
  notifications: {
    items: [],
    unread: 0,
  },
  alerts: {
    successAlert: {
      open: false,
      message: '',
    },
    errorAlert: {
      open: false,
      message: '',
    },
    infoAlert: {
      open: false,
      message: '',
    },
    warningAlert: {
      open: false,
      message: '',
    },
  },
  dialogs: {
    confirmDialog: {
      open: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null,
    },
    deleteDialog: {
      open: false,
      title: '',
      message: '',
      itemToDelete: null,
      onConfirm: null,
    },
  },
  loading: {
    global: false,
    pageLoading: false,
  },
  theme: {
    mode: localStorage.getItem('themeMode') || 'light', // 'light' or 'dark'
  },
  filters: {
    dateRange: {
      startDate: null,
      endDate: null,
    },
    status: '',
    type: '',
    searchQuery: '',
  },
  dataRefresh: {
    lastUpdated: null,
    autoRefresh: false,
    refreshInterval: 60000, // 1 minute
  },
};

// Create UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebar.open = !state.sidebar.open;
    },
    setSidebarOpen: (state, action) => {
      state.sidebar.open = action.payload;
    },
    setSidebarVariant: (state, action) => {
      state.sidebar.variant = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action) => {
      state.notifications.items.unshift(action.payload);
      state.notifications.unread += 1;
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.items.find(
        (item) => item.id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.notifications.unread -= 1;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.items.forEach((item) => {
        item.read = true;
      });
      state.notifications.unread = 0;
    },
    clearNotifications: (state) => {
      state.notifications.items = [];
      state.notifications.unread = 0;
    },
    
    // Alert actions
    showSuccessAlert: (state, action) => {
      state.alerts.successAlert = {
        open: true,
        message: action.payload,
      };
    },
    showErrorAlert: (state, action) => {
      state.alerts.errorAlert = {
        open: true,
        message: action.payload,
      };
    },
    showInfoAlert: (state, action) => {
      state.alerts.infoAlert = {
        open: true,
        message: action.payload,
      };
    },
    showWarningAlert: (state, action) => {
      state.alerts.warningAlert = {
        open: true,
        message: action.payload,
      };
    },
    hideSuccessAlert: (state) => {
      state.alerts.successAlert.open = false;
    },
    hideErrorAlert: (state) => {
      state.alerts.errorAlert.open = false;
    },
    hideInfoAlert: (state) => {
      state.alerts.infoAlert.open = false;
    },
    hideWarningAlert: (state) => {
      state.alerts.warningAlert.open = false;
    },
    resetAlerts: (state) => {
      state.alerts = initialState.alerts;
    },
    
    // Dialog actions
    showConfirmDialog: (state, action) => {
      state.dialogs.confirmDialog = {
        open: true,
        title: action.payload.title || 'Confirm Action',
        message: action.payload.message || 'Are you sure you want to proceed?',
        confirmText: action.payload.confirmText || 'Confirm',
        cancelText: action.payload.cancelText || 'Cancel',
        onConfirm: action.payload.onConfirm || null,
        onCancel: action.payload.onCancel || null,
      };
    },
    hideConfirmDialog: (state) => {
      state.dialogs.confirmDialog.open = false;
    },
    showDeleteDialog: (state, action) => {
      state.dialogs.deleteDialog = {
        open: true,
        title: action.payload.title || 'Delete Item',
        message: action.payload.message || 'Are you sure you want to delete this item?',
        itemToDelete: action.payload.itemToDelete || null,
        onConfirm: action.payload.onConfirm || null,
      };
    },
    hideDeleteDialog: (state) => {
      state.dialogs.deleteDialog.open = false;
    },
    
    // Loading actions
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setPageLoading: (state, action) => {
      state.loading.pageLoading = action.payload;
    },
    
    // Theme actions
    setThemeMode: (state, action) => {
      state.theme.mode = action.payload;
      localStorage.setItem('themeMode', action.payload);
    },
    toggleThemeMode: (state) => {
      const newMode = state.theme.mode === 'light' ? 'dark' : 'light';
      state.theme.mode = newMode;
      localStorage.setItem('themeMode', newMode);
    },
    
    // Filter actions
    setDateRange: (state, action) => {
      state.filters.dateRange = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setTypeFilter: (state, action) => {
      state.filters.type = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.filters.searchQuery = action.payload;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Data refresh actions
    updateLastRefreshed: (state) => {
      state.dataRefresh.lastUpdated = new Date().toISOString();
    },
    toggleAutoRefresh: (state) => {
      state.dataRefresh.autoRefresh = !state.dataRefresh.autoRefresh;
    },
    setAutoRefresh: (state, action) => {
      state.dataRefresh.autoRefresh = action.payload;
    },
    setRefreshInterval: (state, action) => {
      state.dataRefresh.refreshInterval = action.payload;
    },
  },
});

export const {
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  setSidebarVariant,
  
  // Notifications
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  
  // Alerts
  showSuccessAlert,
  showErrorAlert,
  showInfoAlert,
  showWarningAlert,
  hideSuccessAlert,
  hideErrorAlert,
  hideInfoAlert,
  hideWarningAlert,
  resetAlerts,
  
  // Dialogs
  showConfirmDialog,
  hideConfirmDialog,
  showDeleteDialog,
  hideDeleteDialog,
  
  // Loading
  setGlobalLoading,
  setPageLoading,
  
  // Theme
  setThemeMode,
  toggleThemeMode,
  
  // Filters
  setDateRange,
  setStatusFilter,
  setTypeFilter,
  setSearchQuery,
  resetFilters,
  
  // Data refresh
  updateLastRefreshed,
  toggleAutoRefresh,
  setAutoRefresh,
  setRefreshInterval,
} = uiSlice.actions;

export default uiSlice.reducer;
