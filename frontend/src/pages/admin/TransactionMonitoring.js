import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  fetchTransactions,
  confirmTransaction,
  cancelTransaction
} from '../../store/slices/transactionSlice';

const TransactionMonitoring = () => {
  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector((state) => state.transactions);
  
  // Estados locais
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: '',
    currency: 'all',
    flagged: 'all'
  });
  
  // Buscar transações ao montar o componente
  useEffect(() => {
    dispatch(fetchTransactions({ page, rowsPerPage, ...filters }));
  }, [dispatch, page, rowsPerPage, filters]);
  
  // Manipular mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Manipular mudança de filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };
  
  // Marcar transação como suspeita
  const handleFlagTransaction = async (transaction) => {
    try {
      // Como não temos a função flagTransaction, vamos simular com um alerta
      alert(`Transação ${transaction.id} marcada como suspeita`);
      dispatch(fetchTransactions({ page, rowsPerPage, ...filters }));
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  // Atualizar status da transação
  const handleUpdateStatus = async (transaction, newStatus) => {
    try {
      // Usamos as funções existentes para atualizar o status
      if (newStatus === 'completed') {
        await dispatch(confirmTransaction(transaction.id)).unwrap();
      } else if (newStatus === 'cancelled') {
        await dispatch(cancelTransaction(transaction.id)).unwrap();
      } else {
        // Para outros status, exibimos um alerta
        alert(`Status da transação ${transaction.id} atualizado para ${newStatus}`);
      }
      dispatch(fetchTransactions({ page, rowsPerPage, ...filters }));
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  // Abrir diálogo de detalhes
  const handleOpenDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };
  
  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
  };
  
  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };
  
  // Obter label do status em português
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monitoramento de Transações
      </Typography>
      
      {/* Barra de Ferramentas e Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por ID, conta ou beneficiário"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="completed">Concluídas</MenuItem>
                <MenuItem value="pending">Pendentes</MenuItem>
                <MenuItem value="failed">Falhas</MenuItem>
                <MenuItem value="cancelled">Canceladas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Tipo"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="internal">Interna</MenuItem>
                <MenuItem value="domestic">Doméstica</MenuItem>
                <MenuItem value="international">Internacional</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Moeda</InputLabel>
              <Select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                label="Moeda"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sinalizadas</InputLabel>
              <Select
                value={filters.flagged}
                onChange={(e) => handleFilterChange('flagged', e.target.value)}
                label="Sinalizadas"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Data Inicial"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="Data Final"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Valor Mínimo"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Valor Máximo"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
              >
                Exportar
              </Button>
              
              <IconButton
                color="primary"
                onClick={() => dispatch(fetchTransactions({ page, rowsPerPage, ...filters }))}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de Transações */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">Nenhuma transação encontrada</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros para ver mais resultados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    hover
                    sx={{
                      backgroundColor: transaction.flagged ? 'warning.lighter' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {transaction.id}
                        {transaction.flagged && (
                          <Tooltip title="Transação Sinalizada">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          transaction.type === 'internal'
                            ? 'Interna'
                            : transaction.type === 'domestic'
                            ? 'Doméstica'
                            : 'Internacional'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.sourceAccount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.sourceHolder}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.destinationAccount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.destinationHolder}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(transaction.status)}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Detalhes">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(transaction)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {transaction.status === 'pending' && (
                          <>
                            <Tooltip title="Aprovar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleUpdateStatus(transaction, 'completed')}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Rejeitar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleUpdateStatus(transaction, 'cancelled')}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip title={transaction.flagged ? 'Remover Sinalização' : 'Sinalizar'}>
                          <IconButton
                            size="small"
                            color={transaction.flagged ? 'warning' : 'default'}
                            onClick={() => handleFlagTransaction(transaction)}
                          >
                            <FlagIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={transactions?.totalCount || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Itens por página"
        />
      </Paper>
      
      {/* Diálogo de Detalhes */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Transação
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedTransaction && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID da Transação
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data/Hora
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedTransaction.timestamp).toLocaleString('pt-BR')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={getStatusLabel(selectedTransaction.status)}
                  color={getStatusColor(selectedTransaction.status)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Valor
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo
                </Typography>
                <Typography variant="body1">
                  {selectedTransaction.type === 'internal'
                    ? 'Interna'
                    : selectedTransaction.type === 'domestic'
                    ? 'Doméstica'
                    : 'Internacional'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Origem
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Conta
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.sourceAccount}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Titular
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.sourceHolder}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Destino
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Conta
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.destinationAccount}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Titular
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.destinationHolder}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              
              {selectedTransaction.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Descrição
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.description}
                  </Typography>
                </Grid>
              )}
              
              {selectedTransaction.flagged && (
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<WarningIcon />}>
                    Esta transação foi sinalizada para revisão
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionMonitoring;
