import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { fetchAccounts } from '../../store/slices/accountSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchTransactions } from '../../store/slices/transactionSlice';

const ClientTransactions = () => {
  const dispatch = useDispatch();
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { transactions, loading: transactionsLoading, totalItems, totalPages } = useSelector((state) => state.transactions);
  
  const [filters, setFilters] = useState({
    accountId: '',
    userId: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 0,
    limit: 10
  });
  
  useEffect(() => {
    // Carregar contas e usuários ao montar o componente
    dispatch(fetchAccounts());
    dispatch(fetchUsers());
  }, [dispatch]);
  
  useEffect(() => {
    // Buscar transações com base nos filtros
    handleSearch();
  }, [filters.page, filters.limit]);
  
  const handleSearch = () => {
    dispatch(fetchTransactions({
      ...filters,
      page: filters.page + 1 // API espera páginas começando em 1
    }));
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 0 // Resetar para a primeira página ao mudar filtros
    });
  };
  
  const handleResetFilters = () => {
    setFilters({
      accountId: '',
      userId: '',
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 0,
      limit: 10
    });
  };
  
  const handleChangePage = (event, newPage) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };
  
  const handleChangeRowsPerPage = (event) => {
    setFilters({
      ...filters,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
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
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Transações dos Clientes
        </Typography>
        
        <Box>
          <Tooltip title="Atualizar">
            <IconButton onClick={handleSearch}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon color="primary" sx={{ fontSize: 24, mr: 2 }} />
          <Typography variant="h6">Filtros</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="account-select-label">Conta</InputLabel>
              <Select
                labelId="account-select-label"
                id="account-select"
                name="accountId"
                value={filters.accountId}
                label="Conta"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {accounts && accounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.accountNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-select-label">Usuário</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                name="userId"
                value={filters.userId}
                label="Usuário"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {users && users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {`${user.firstName} ${user.lastName}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-select-label">Tipo</InputLabel>
              <Select
                labelId="type-select-label"
                id="type-select"
                name="type"
                value={filters.type}
                label="Tipo"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="DEPOSIT">Depósito</MenuItem>
                <MenuItem value="WITHDRAWAL">Saque</MenuItem>
                <MenuItem value="TRANSFER">Transferência</MenuItem>
                <MenuItem value="PAYMENT">Pagamento</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="COMPLETED">Concluída</MenuItem>
                <MenuItem value="PENDING">Pendente</MenuItem>
                <MenuItem value="FAILED">Falha</MenuItem>
                <MenuItem value="CANCELLED">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Data Inicial"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Data Final"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={12} md={4} lg={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
              >
                Buscar
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
              >
                Limpar Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabela de Transações */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReceiptIcon color="primary" sx={{ fontSize: 24, mr: 2 }} />
          <Typography variant="h6">Transações</Typography>
          
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Exportar PDF">
              <IconButton>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Imprimir">
              <IconButton>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {transactionsLoading ? (
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
                    <TableCell>Data</TableCell>
                    <TableCell>Conta</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{transaction._id.substring(0, 8)}...</TableCell>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>{transaction.accountId?.accountNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {transaction.userId ? 
                          `${transaction.userId.firstName} ${transaction.userId.lastName}` : 
                          'N/A'}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            transaction.type === 'DEPOSIT' ? 'Depósito' : 
                            transaction.type === 'WITHDRAWAL' ? 'Saque' : 
                            transaction.type === 'TRANSFER' ? 'Transferência' : 
                            transaction.type === 'PAYMENT' ? 'Pagamento' : 
                            transaction.type
                          }
                          size="small"
                          color={
                            transaction.type === 'DEPOSIT' ? 'success' : 
                            transaction.type === 'WITHDRAWAL' ? 'warning' : 
                            transaction.type === 'TRANSFER' ? 'info' : 
                            transaction.type === 'PAYMENT' ? 'secondary' : 
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            transaction.status === 'COMPLETED' ? 'Concluída' : 
                            transaction.status === 'PENDING' ? 'Pendente' : 
                            transaction.status === 'FAILED' ? 'Falha' : 
                            transaction.status === 'CANCELLED' ? 'Cancelada' : 
                            transaction.status
                          }
                          size="small"
                          color={
                            transaction.status === 'COMPLETED' ? 'success' : 
                            transaction.status === 'PENDING' ? 'warning' : 
                            transaction.status === 'FAILED' ? 'error' : 
                            transaction.status === 'CANCELLED' ? 'default' : 
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: transaction.amount > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={totalItems || 0}
              page={filters.page}
              onPageChange={handleChangePage}
              rowsPerPage={filters.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        ) : (
          <Alert severity="info">Nenhuma transação encontrada com os filtros selecionados.</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default ClientTransactions;
