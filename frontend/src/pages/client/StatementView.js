import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
  DateRange as DateRangeIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fetchAccountStatement, generateStatementPdf } from '../../store/slices/statementSlice';

const StatementView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accountId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Obter dados do Redux store
  const { accountStatement, loading, error, pdfLoading } = useSelector((state) => state.statements);
  
  // Estado para filtros e paginação
  const [filters, setFilters] = useState({
    startDate: queryParams.get('startDate') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: queryParams.get('endDate') || new Date().toISOString().split('T')[0],
    type: queryParams.get('type') || ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  
  // Buscar dados do extrato
  const fetchStatement = () => {
    dispatch(fetchAccountStatement({
      accountId,
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type || undefined,
        page: page + 1,
        limit: rowsPerPage
      }
    }));
  };
  
  // Buscar dados quando os filtros ou paginação mudam
  useEffect(() => {
    if (accountId) {
      fetchStatement();
    }
  }, [accountId, filters, page, rowsPerPage, dispatch]);
  
  // Baixar extrato em PDF
  const handleDownloadPdf = () => {
    dispatch(generateStatementPdf({
      accountId,
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type || undefined
      }
    }));
  };
  
  // Imprimir extrato
  const handlePrint = () => {
    window.print();
  };
  
  // Voltar para a página anterior
  const handleBack = () => {
    navigate(-1);
  };
  
  // Atualizar filtros
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
    setPage(0);
  };
  
  // Alternar exibição de filtros
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Manipular mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
  
  // Obter ícone do tipo de transação
  const getTransactionTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'withdrawal':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      case 'transfer':
        return <SwapHorizIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return <ScheduleIcon sx={{ color: theme.palette.primary.main }} />;
    }
  };
  
  // Obter cor do tipo de transação
  const getTransactionTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'success';
      case 'withdrawal':
        return 'error';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
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
  
  // Extrair dados da conta e transações do estado
  const account = accountStatement?.account || null;
  const transactions = accountStatement?.transactions || [];
  const pagination = accountStatement?.pagination || { total: 0 };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Extrato da Conta
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Informações da Conta */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : account ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Informações da Conta
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Número da Conta
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {account.number}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Tipo de Conta
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {account.type}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Moeda
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {account.currency}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Saldo Atual
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {formatCurrency(account.currentBalance, account.currency)}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography>Nenhum dado disponível</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Filtros e Ações */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Ações
              </Typography>
              <IconButton onClick={handleToggleFilters}>
                <FilterListIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? <CircularProgress size={24} /> : 'PDF'}
                </Button>
              </Grid>
              
              <Grid item xs={6}>
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
                  
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Data Inicial"
                        value={filters.startDate ? new Date(filters.startDate) : null}
                        onChange={(newValue) => handleFilterChange('startDate', newValue ? newValue.toISOString().split('T')[0] : null)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Data Final"
                        value={filters.endDate ? new Date(filters.endDate) : null}
                        onChange={(newValue) => handleFilterChange('endDate', newValue ? newValue.toISOString().split('T')[0] : null)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Transação</InputLabel>
                      <Select
                        value={filters.type}
                        label="Tipo de Transação"
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="deposit">Depósito</MenuItem>
                        <MenuItem value="withdrawal">Saque</MenuItem>
                        <MenuItem value="transfer">Transferência</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={fetchStatement}
                    >
                      Atualizar
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
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Período: {filters.startDate ? formatDate(filters.startDate) : 'Início'} a {filters.endDate ? formatDate(filters.endDate) : 'Hoje'}
                {filters.type && ` | Tipo: ${filters.type}`}
              </Typography>
            </Box>
            
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
                        <TableCell>Data</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getTransactionTypeIcon(transaction.type)}
                              label={transaction.type}
                              size="small"
                              color={getTransactionTypeColor(transaction.type)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              color={transaction.isDebit ? 'error.main' : 'success.main'}
                            >
                              {transaction.isDebit ? '-' : '+'} {formatCurrency(transaction.amount, transaction.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {transaction.balance ? formatCurrency(transaction.balance, transaction.currency) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Linhas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                Nenhuma transação encontrada para o período selecionado
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatementView;
