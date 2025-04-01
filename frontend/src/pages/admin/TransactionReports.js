import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  AccountBalance as AccountIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  SwapHoriz as SwapIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const TOKEN = localStorage.getItem('token') || 'admin_test';

const TransactionReports = () => {
  // Estado para filtros
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    transactionType: '',
    currency: '',
    accountNumber: '',
    minAmount: '',
    maxAmount: '',
    userId: '',
    status: ''
  });

  // Estado para dados e paginação
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    totalVolume: 0,
    volumeByType: {},
    volumeByCurrency: {}
  });
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage]);

  // Buscar transações com filtros
  const fetchTransactions = async (useFilters = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Preparar query params
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      // Adicionar filtros se necessário
      if (useFilters) {
        if (filters.startDate) params.startDate = filters.startDate.toISOString().split('T')[0];
        if (filters.endDate) params.endDate = filters.endDate.toISOString().split('T')[0];
        if (filters.transactionType) params.transactionType = filters.transactionType;
        if (filters.currency) params.currency = filters.currency;
        if (filters.accountNumber) params.accountNumber = filters.accountNumber;
        if (filters.minAmount) params.minAmount = filters.minAmount;
        if (filters.maxAmount) params.maxAmount = filters.maxAmount;
        if (filters.userId) params.userId = filters.userId;
        if (filters.status) params.status = filters.status;
      }
      
      const response = await axios.get(`${API_URL}/admin/transactions`, {
        params,
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });
      
      if (response.data.status === 'success') {
        setTransactions(response.data.data || []);
        setTotalTransactions(response.data.total || 0);
        
        // Atualizar métricas
        if (response.data.metrics) {
          setMetrics(response.data.metrics);
        }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar transações');
      }
    } catch (err) {
      console.error('Erro na obtenção de transações:', err);
      setError(err.message || 'Falha ao carregar dados de transações');
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    setPage(0); // Resetar para primeira página ao aplicar filtros
    fetchTransactions(true);
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      transactionType: '',
      currency: '',
      accountNumber: '',
      minAmount: '',
      maxAmount: '',
      userId: '',
      status: ''
    });
    
    setPage(0);
    fetchTransactions(false);
  };
  
  // Mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Abrir detalhes da transação
  const handleOpenDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };
  
  // Fechar detalhes da transação
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };
  
  // Exportar relatório para CSV
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      // Preparar query params para exportação (todos os resultados)
      const params = { export: 'csv' };
      
      // Adicionar filtros atuais
      if (filters.startDate) params.startDate = filters.startDate.toISOString().split('T')[0];
      if (filters.endDate) params.endDate = filters.endDate.toISOString().split('T')[0];
      if (filters.transactionType) params.transactionType = filters.transactionType;
      if (filters.currency) params.currency = filters.currency;
      if (filters.accountNumber) params.accountNumber = filters.accountNumber;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;
      if (filters.userId) params.userId = filters.userId;
      if (filters.status) params.status = filters.status;
      
      const response = await axios.get(`${API_URL}/admin/transactions/export`, {
        params,
        headers: {
          Authorization: `Bearer ${TOKEN}`
        },
        responseType: 'blob'
      });
      
      // Criar URL para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo com data atual
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `transactions_report_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Falha na exportação do relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obter ícone do tipo de transação
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <DownIcon color="success" />;
      case 'withdrawal':
        return <UpIcon color="error" />;
      case 'transfer':
        return <SwapIcon color="primary" />;
      default:
        return <SwapIcon />;
    }
  };
  
  // Obter cor do chip de status
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
  
  // Renderizar conteúdo principal
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Relatório de Transações
      </Typography>
      
      {/* Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Volume Total
              </Typography>
              <Typography variant="h4">
                {metrics.totalVolume.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Depósitos
              </Typography>
              <Typography variant="h4">
                {(metrics.volumeByType?.deposit || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Saques
              </Typography>
              <Typography variant="h4">
                {(metrics.volumeByType?.withdrawal || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Transferências
              </Typography>
              <Typography variant="h4">
                {(metrics.volumeByType?.transfer || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Data Inicial"
                value={filters.startDate}
                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Data Final"
                value={filters.endDate}
                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="transaction-type-label">Tipo de Transação</InputLabel>
              <Select
                labelId="transaction-type-label"
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                label="Tipo de Transação"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="deposit">Depósito</MenuItem>
                <MenuItem value="withdrawal">Saque</MenuItem>
                <MenuItem value="transfer">Transferência</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="currency-label">Moeda</InputLabel>
              <Select
                labelId="currency-label"
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                label="Moeda"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="USDT">USDT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <TextField
              fullWidth
              margin="normal"
              label="Número da Conta"
              value={filters.accountNumber}
              onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <TextField
              fullWidth
              margin="normal"
              label="Valor Mínimo"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <TextField
              fullWidth
              margin="normal"
              label="Valor Máximo"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="completed">Completo</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="failed">Falhou</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            sx={{ mr: 2 }}
          >
            Limpar Filtros
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleApplyFilters}
            startIcon={<SearchIcon />}
          >
            Aplicar Filtros
          </Button>
        </Box>
      </Paper>
      
      {/* Tabela de Resultados */}
      <Paper sx={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Resultados ({totalTransactions})
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchTransactions(true)}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Atualizar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={handleExportCSV}
              disabled={loading || transactions.length === 0}
            >
              Exportar CSV
            </Button>
          </Box>
        </Box>
        
        <Divider />
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : transactions.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Nenhuma transação encontrada com os filtros atuais.
          </Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Conta Origem</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Conta Destino</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Moeda</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    hover
                    sx={{ '&:hover': { cursor: 'pointer' } }}
                    onClick={() => handleOpenDetails(transaction)}
                  >
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTransactionTypeIcon(transaction.transactionType)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {transaction.transactionType === 'deposit' 
                            ? 'Depósito' 
                            : transaction.transactionType === 'withdrawal' 
                              ? 'Saque' 
                              : 'Transferência'
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.sourceAccountNumber || '-'}</TableCell>
                    <TableCell>{transaction.destinationAccountNumber || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {parseFloat(transaction.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: transaction.currency
                      })}
                    </TableCell>
                    <TableCell>{transaction.currency}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status === 'completed' 
                          ? 'Completo' 
                          : transaction.status === 'pending' 
                            ? 'Pendente' 
                            : 'Falhou'
                        } 
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver Detalhes">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(transaction);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalTransactions}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
        />
      </Paper>
      
      {/* Diálogo de Detalhes da Transação */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedTransaction && (
          <>
            <DialogTitle>
              Detalhes da Transação #{selectedTransaction.id}
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informações da Transação
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Tipo:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getTransactionTypeIcon(selectedTransaction.transactionType)}
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {selectedTransaction.transactionType === 'deposit' 
                          ? 'Depósito' 
                          : selectedTransaction.transactionType === 'withdrawal' 
                            ? 'Saque' 
                            : 'Transferência'
                        }
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary">
                      Data e Hora:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(selectedTransaction.createdAt)}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary">
                      Valor:
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {parseFloat(selectedTransaction.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: selectedTransaction.currency
                      })}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary">
                      Moeda:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedTransaction.currency}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary">
                      Status:
                    </Typography>
                    <Chip 
                      label={selectedTransaction.status === 'completed' 
                        ? 'Completo' 
                        : selectedTransaction.status === 'pending' 
                          ? 'Pendente' 
                          : 'Falhou'
                      } 
                      color={getStatusColor(selectedTransaction.status)}
                      size="small"
                    />
                    
                    {selectedTransaction.description && (
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                          Descrição:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedTransaction.description}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informações das Contas
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {selectedTransaction.sourceAccountId && (
                      <>
                        <Typography variant="body2" color="textSecondary">
                          Conta de Origem:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            {selectedTransaction.sourceAccountNumber}
                          </Typography>
                        </Box>
                        
                        {selectedTransaction.sourceUserId && (
                          <>
                            <Typography variant="body2" color="textSecondary">
                              Usuário de Origem:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <PersonIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="body1">
                                {selectedTransaction.sourceUserName || selectedTransaction.sourceUserId}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </>
                    )}
                    
                    {selectedTransaction.destinationAccountId && (
                      <>
                        <Typography variant="body2" color="textSecondary">
                          Conta de Destino:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccountIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            {selectedTransaction.destinationAccountNumber}
                          </Typography>
                        </Box>
                        
                        {selectedTransaction.destinationUserId && (
                          <>
                            <Typography variant="body2" color="textSecondary">
                              Usuário de Destino:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <PersonIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="body1">
                                {selectedTransaction.destinationUserName || selectedTransaction.destinationUserId}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                  
                  {selectedTransaction.failReason && (
                    <Box sx={{ mt: 3 }}>
                      <Alert severity="error">
                        <Typography variant="subtitle2">
                          Motivo da Falha:
                        </Typography>
                        {selectedTransaction.failReason}
                      </Alert>
                    </Box>
                  )}
                </Grid>
                
                {/* Metadados e informações adicionais */}
                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Dados Adicionais
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Campo</TableCell>
                            <TableCell>Valor</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedTransaction.metadata).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell component="th" scope="row">
                                {key}
                              </TableCell>
                              <TableCell>{String(value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDetails} color="primary">
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TransactionReports;
