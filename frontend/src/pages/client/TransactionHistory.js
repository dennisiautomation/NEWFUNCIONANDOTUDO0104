import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  CompareArrows as CompareArrowsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fetchTransactions } from '../../store/slices/transactionSlice';
import { fetchAccounts } from '../../store/slices/accountSlice';

const TransactionHistory = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();
  const queryParams = new URLSearchParams(location.search);
  const accountIdFromURL = queryParams.get('accountId');
  
  // Get data from Redux store
  const { transactions, loading, error } = useSelector((state) => state.transactions);
  const { accounts } = useSelector((state) => state.accounts);
  
  // State for filters
  const [filters, setFilters] = useState({
    accountId: accountIdFromURL || '',
    type: '',
    startDate: null,
    endDate: null,
    searchTerm: ''
  });
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filter visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch transactions and accounts on component mount
  useEffect(() => {
    dispatch(fetchAccounts());
    
    const params = {
      limit: rowsPerPage,
      skip: page * rowsPerPage,
      sort: '-date'
    };
    
    if (filters.accountId) {
      params.accountId = filters.accountId;
    }
    
    if (filters.type) {
      params.type = filters.type;
    }
    
    if (filters.startDate) {
      params.startDate = filters.startDate.toISOString();
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate.toISOString();
    }
    
    if (filters.searchTerm) {
      params.search = filters.searchTerm;
    }
    
    dispatch(fetchTransactions(params));
  }, [dispatch, page, rowsPerPage, filters]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
    setPage(0); // Reset to first page when filter changes
  };
  
  // Handle filter toggle
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      accountId: '',
      type: '',
      startDate: null,
      endDate: null,
      searchTerm: ''
    });
    setPage(0);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The search term is already in filters state, so fetchTransactions will be called via useEffect
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Helper function to format amount
  const formatAmount = (amount) => {
    if (typeof amount === 'string' && amount.startsWith('$')) {
      return amount; // Already formatted
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Helper function to get transaction type icon
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'withdrawal':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      case 'transfer':
        return <CompareArrowsIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return <PaymentIcon sx={{ color: theme.palette.primary.main }} />;
    }
  };
  
  // Get sample data if no real data is available yet
  const getSampleTransactions = () => {
    return [
      {
        id: 't1',
        type: 'deposit',
        amount: '$1,500.00',
        from: 'Direct Deposit - ABC Corp',
        to: 'Primary Checking',
        status: 'completed',
        date: '2023-05-20T10:30:00Z',
        reference: 'REF123456'
      },
      {
        id: 't2',
        type: 'withdrawal',
        amount: '$200.00',
        from: 'Primary Checking',
        to: 'ATM Withdrawal',
        status: 'completed',
        date: '2023-05-19T15:45:00Z',
        reference: 'REF123457'
      },
      {
        id: 't3',
        type: 'transfer',
        amount: '$500.00',
        from: 'Primary Checking',
        to: 'Savings Account',
        status: 'completed',
        date: '2023-05-18T09:15:00Z',
        reference: 'REF123458'
      },
      {
        id: 't4',
        type: 'payment',
        amount: '$75.50',
        from: 'Primary Checking',
        to: 'Electric Company',
        status: 'pending',
        date: '2023-05-17T14:20:00Z',
        reference: 'REF123459'
      },
      {
        id: 't5',
        type: 'deposit',
        amount: '$100.00',
        from: 'Mobile Deposit',
        to: 'Savings Account',
        status: 'completed',
        date: '2023-05-16T11:10:00Z',
        reference: 'REF123460'
      }
    ];
  };
  
  const transactionsToDisplay = transactions && transactions.length > 0 ? transactions : getSampleTransactions();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        View and filter your recent transactions
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Search and Filters Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                placeholder="Search by description, reference number, or amount"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('searchTerm', '')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
                size="small"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleToggleFilters}
                size="small"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                size="small"
              >
                Export
              </Button>
              
              <IconButton
                color="primary"
                onClick={() => {
                  // Refresh transactions with current filters
                  dispatch(fetchTransactions({
                    ...filters,
                    limit: rowsPerPage,
                    skip: page * rowsPerPage,
                    sort: '-date'
                  }));
                }}
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="account-filter-label">Account</InputLabel>
                  <Select
                    labelId="account-filter-label"
                    id="account-filter"
                    value={filters.accountId}
                    label="Account"
                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {accounts && accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.accountName || `Account ending in ${account.accountNumber.slice(-4)}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-filter-label">Transaction Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    id="type-filter"
                    value={filters.type}
                    label="Transaction Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="deposit">Deposits</MenuItem>
                    <MenuItem value="withdrawal">Withdrawals</MenuItem>
                    <MenuItem value="transfer">Transfers</MenuItem>
                    <MenuItem value="payment">Payments</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filters.startDate}
                    onChange={(newValue) => handleFilterChange('startDate', newValue)}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    maxDate={filters.endDate || new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filters.endDate}
                    onChange={(newValue) => handleFilterChange('endDate', newValue)}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    minDate={filters.startDate}
                    maxDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Transactions Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactionsToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">No transactions found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters to see more results
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactionsToDisplay.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTransactionIcon(transaction.type)}
                        <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {transaction.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.type === 'transfer' 
                          ? `${transaction.from} → ${transaction.to}`
                          : transaction.type === 'deposit'
                            ? `${transaction.from} → ${transaction.to}`
                            : transaction.type === 'withdrawal'
                              ? `${transaction.from} → ${transaction.to}`
                              : `${transaction.from} → ${transaction.to}`
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.reference || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: transaction.type === 'deposit' 
                            ? theme.palette.success.main 
                            : transaction.type === 'withdrawal' 
                              ? theme.palette.error.main 
                              : 'inherit'
                        }}
                      >
                        {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                        {formatAmount(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={100} // Replace with actual count from API when available
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
};

export default TransactionHistory;
