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
  SwapHoriz as SwapHorizIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  fetchTransactionReport,
  generateTransactionPdf,
  setTransactionPage,
  setTransactionLimit,
  clearTransactionError
} from '../../store/slices/adminReportSlice';

const AdminTransactionReport = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Selecionar dados do Redux store
  const {
    data: transactions,
    pagination,
    loading,
    pdfLoading,
    error
  } = useSelector((state) => state.adminReports.transactions);
  
  // Estado local para filtros
  const [filters, setFilters] = useState({
    accountId: '',
    userId: '',
    type: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Buscar transações
  const fetchTransactions = () => {
    const params = {
      accountId: filters.accountId || undefined,
      userId: filters.userId || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: pagination.page + 1,
      limit: pagination.limit
    };
    
    dispatch(fetchTransactionReport(params));
  };
  
  // Buscar dados quando os filtros ou paginação mudam
  useEffect(() => {
    fetchTransactions();
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
    dispatch(setTransactionPage(0));
    fetchTransactions();
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      accountId: '',
      userId: '',
      type: '',
      status: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    });
  };
  
  // Manipular mudança de página
  const handleChangePage = (event, newPage) => {
    dispatch(setTransactionPage(newPage));
  };
  
  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    dispatch(setTransactionLimit(parseInt(event.target.value, 10)));
  };
  
  // Limpar erro
  const handleClearError = () => {
    dispatch(clearTransactionError());
  };
  
  // Gerar PDF
  const handleGeneratePdf = () => {
    const params = {
      accountId: filters.accountId || undefined,
      userId: filters.userId || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };
    
    dispatch(generateTransactionPdf(params));
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obter cor do status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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
  
  // Obter ícone do tipo
  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return <AttachMoneyIcon />;
      case 'withdrawal':
        return <AccountBalanceIcon />;
      case 'transfer':
        return <SwapHorizIcon />;
      default:
        return <SwapHorizIcon />;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Relatório de Transações
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchTransactions}
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
                  startIcon={<FileDownloadIcon />}
                  onClick={handleGeneratePdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
              </Grid>
              
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
                      label="ID da Conta"
                      value={filters.accountId}
                      onChange={(e) => handleFilterChange('accountId', e.target.value)}
                    />
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
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={filters.type}
                        label="Tipo"
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="deposit">Depósito</MenuItem>
                        <MenuItem value="withdrawal">Saque</MenuItem>
                        <MenuItem value="transfer">Transferência</MenuItem>
                      </Select>
                    </FormControl>
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
                        <MenuItem value="completed">Concluído</MenuItem>
                        <MenuItem value="pending">Pendente</MenuItem>
                        <MenuItem value="failed">Falha</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Valor Mínimo"
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Valor Máximo"
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Data Inicial"
                        value={filters.startDate ? new Date(filters.startDate) : null}
                        onChange={(newValue) => handleFilterChange('startDate', newValue ? newValue.toISOString().split('T')[0] : null)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Data Final"
                        value={filters.endDate ? new Date(filters.endDate) : null}
                        onChange={(newValue) => handleFilterChange('endDate', newValue ? newValue.toISOString().split('T')[0] : null)}
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
        
        {/* Tabela de Transações */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transações
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : transactions && transactions.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Conta</TableCell>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccountBalanceIcon sx={{ mr: 1, fontSize: 16 }} />
                              {transaction.accountId}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                              {transaction.userId}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getTypeIcon(transaction.type)}
                              label={transaction.type}
                              size="small"
                              color="default"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status)}
                            />
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
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
                Nenhuma transação encontrada para os filtros selecionados
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminTransactionReport;
