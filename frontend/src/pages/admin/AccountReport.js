import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  fetchAccountReport,
  setAccountPage,
  setAccountLimit,
  clearAccountError
} from '../../store/slices/adminReportSlice';

const AdminAccountReport = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Selecionar dados do Redux store
  const {
    data: accounts,
    pagination,
    loading,
    error
  } = useSelector((state) => state.adminReports.accounts);
  
  // Estado local para filtros
  const [filters, setFilters] = useState({
    userId: '',
    accountNumber: '',
    status: '',
    minBalance: '',
    maxBalance: '',
    type: '',
    createdAfter: '',
    createdBefore: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Buscar contas
  const fetchAccounts = () => {
    const params = {
      userId: filters.userId || undefined,
      accountNumber: filters.accountNumber || undefined,
      status: filters.status || undefined,
      minBalance: filters.minBalance || undefined,
      maxBalance: filters.maxBalance || undefined,
      type: filters.type || undefined,
      createdAfter: filters.createdAfter || undefined,
      createdBefore: filters.createdBefore || undefined,
      page: pagination.page + 1,
      limit: pagination.limit
    };
    
    dispatch(fetchAccountReport(params));
  };
  
  // Buscar dados quando os filtros ou paginação mudam
  useEffect(() => {
    fetchAccounts();
  }, [pagination.page, pagination.limit]);
  
  // Alternar exibição de filtros
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Atualizar filtros
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    dispatch(setAccountPage(0));
    fetchAccounts();
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      userId: '',
      accountNumber: '',
      status: '',
      minBalance: '',
      maxBalance: '',
      type: '',
      createdAfter: '',
      createdBefore: ''
    });
  };
  
  // Manipular mudança de página
  const handleChangePage = (event, newPage) => {
    dispatch(setAccountPage(newPage));
  };
  
  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    dispatch(setAccountLimit(parseInt(event.target.value, 10)));
  };
  
  // Limpar erro
  const handleClearError = () => {
    dispatch(clearAccountError());
  };
  
  // Imprimir relatório
  const handlePrint = () => {
    window.print();
  };
  
  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Obter cor do status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Obter ícone do status
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <LockOpenIcon />;
      case 'inactive':
      case 'blocked':
        return <LockIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Relatório de Contas
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchAccounts}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={handleClearError}
        >
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Filtros e Ações */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Ações e Filtros
              </Typography>
              <IconButton onClick={handleToggleFilters}>
                <FilterListIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Imprimir
                </Button>
              </Grid>
              
              {showFilters && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Filtros
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ID do Usuário"
                      value={filters.userId}
                      onChange={(e) => handleFilterChange('userId', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Número da Conta"
                      value={filters.accountNumber}
                      onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="active">Ativo</MenuItem>
                        <MenuItem value="inactive">Inativo</MenuItem>
                        <MenuItem value="blocked">Bloqueado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Conta</InputLabel>
                      <Select
                        value={filters.type}
                        label="Tipo de Conta"
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="checking">Corrente</MenuItem>
                        <MenuItem value="savings">Poupança</MenuItem>
                        <MenuItem value="investment">Investimento</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Saldo Mínimo"
                      type="number"
                      value={filters.minBalance}
                      onChange={(e) => handleFilterChange('minBalance', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Saldo Máximo"
                      type="number"
                      value={filters.maxBalance}
                      onChange={(e) => handleFilterChange('maxBalance', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Criado Após"
                        value={filters.createdAfter ? new Date(filters.createdAfter) : null}
                        onChange={(newValue) => handleFilterChange('createdAfter', newValue ? newValue.toISOString().split('T')[0] : null)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Criado Antes"
                        value={filters.createdBefore ? new Date(filters.createdBefore) : null}
                        onChange={(newValue) => handleFilterChange('createdBefore', newValue ? newValue.toISOString().split('T')[0] : null)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleApplyFilters}
                    >
                      Aplicar Filtros
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleClearFilters}
                    >
                      Limpar Filtros
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Tabela de Contas */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contas
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : accounts && accounts.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Número da Conta</TableCell>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Data de Criação</TableCell>
                        <TableCell>Última Atualização</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>{account.id}</TableCell>
                          <TableCell>{account.accountNumber}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                              {account.userId}
                            </Box>
                          </TableCell>
                          <TableCell>{account.type}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(account.balance, account.currency)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(account.status)}
                              label={account.status}
                              size="small"
                              color={getStatusColor(account.status)}
                            />
                          </TableCell>
                          <TableCell>{formatDate(account.createdAt)}</TableCell>
                          <TableCell>{formatDate(account.updatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={pagination.page}
                  onPageChange={handleChangePage}
                  rowsPerPage={pagination.limit}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  labelRowsPerPage="Linhas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                Nenhuma conta encontrada para os filtros selecionados
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAccountReport;
