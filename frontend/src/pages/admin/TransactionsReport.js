import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { 
  FileDownloadOutlined, 
  FilterAltOutlined,
  ClearOutlined
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_REPORTS_API_URL } from '../../config';
import { format } from 'date-fns';

const TransactionsReport = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    type: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    userId: '',
    accountId: ''
  });
  
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
    fetchAccounts();
  }, [pagination.page, pagination.limit]);
  
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Construir query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page + 1);
      queryParams.append('limit', pagination.limit);
      
      // Adicionar filtros se existirem
      if (filters.startDate) {
        queryParams.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));
      }
      
      if (filters.type) {
        queryParams.append('type', filters.type);
      }
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.minAmount) {
        queryParams.append('minAmount', filters.minAmount);
      }
      
      if (filters.maxAmount) {
        queryParams.append('maxAmount', filters.maxAmount);
      }
      
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }
      
      if (filters.accountId) {
        queryParams.append('accountId', filters.accountId);
      }
      
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/transactions?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setTransactions(response.data.data);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      toast.error('Não foi possível carregar as transações');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };
  
  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setAccounts(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };
  
  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };
  
  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value
    });
  };
  
  const handleDateChange = (field) => (date) => {
    setFilters({
      ...filters,
      [field]: date
    });
  };
  
  const applyFilters = () => {
    setPagination({
      ...pagination,
      page: 0
    });
    fetchTransactions();
  };
  
  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      type: '',
      status: '',
      minAmount: '',
      maxAmount: '',
      userId: '',
      accountId: ''
    });
    
    setPagination({
      ...pagination,
      page: 0
    });
    
    // Executar busca sem filtros
    setTimeout(fetchTransactions, 0);
  };
  
  const downloadTransactionsPdf = async () => {
    try {
      // Construir query params com os mesmos filtros
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));
      }
      
      if (filters.type) {
        queryParams.append('type', filters.type);
      }
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.minAmount) {
        queryParams.append('minAmount', filters.minAmount);
      }
      
      if (filters.maxAmount) {
        queryParams.append('maxAmount', filters.maxAmount);
      }
      
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }
      
      if (filters.accountId) {
        queryParams.append('accountId', filters.accountId);
      }
      
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/transactions/pdf?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions-report.pdf');
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório baixado com sucesso');
    } catch (error) {
      console.error('Erro ao baixar relatório de transações:', error);
      toast.error('Não foi possível baixar o relatório');
    }
  };
  
  const getStatusChip = (status) => {
    let color = 'default';
    
    switch (status) {
      case 'COMPLETED':
        color = 'success';
        break;
      case 'PENDING':
        color = 'warning';
        break;
      case 'FAILED':
        color = 'error';
        break;
      case 'PROCESSING':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small" 
        variant="outlined"
      />
    );
  };
  
  const getTypeChip = (type) => {
    let color = 'default';
    let label = type;
    
    switch (type) {
      case 'DEPOSIT':
        color = 'success';
        label = 'Depósito';
        break;
      case 'WITHDRAWAL':
        color = 'warning';
        label = 'Saque';
        break;
      case 'TRANSFER':
        color = 'info';
        label = 'Transferência';
        break;
      case 'PAYMENT':
        color = 'secondary';
        label = 'Pagamento';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small"
      />
    );
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Relatório de Transações
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<FileDownloadOutlined />}
          onClick={downloadTransactionsPdf}
        >
          Baixar PDF
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Tipo de Transação</InputLabel>
              <Select
                labelId="type-label"
                value={filters.type}
                label="Tipo de Transação"
                onChange={handleFilterChange('type')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="DEPOSIT">Depósito</MenuItem>
                <MenuItem value="WITHDRAWAL">Saque</MenuItem>
                <MenuItem value="TRANSFER">Transferência</MenuItem>
                <MenuItem value="PAYMENT">Pagamento</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange('status')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="COMPLETED">Concluído</MenuItem>
                <MenuItem value="PENDING">Pendente</MenuItem>
                <MenuItem value="FAILED">Falhou</MenuItem>
                <MenuItem value="PROCESSING">Processando</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-label">Usuário</InputLabel>
              <Select
                labelId="user-label"
                value={filters.userId}
                label="Usuário"
                onChange={handleFilterChange('userId')}
              >
                <MenuItem value="">Todos</MenuItem>
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="account-label">Conta</InputLabel>
              <Select
                labelId="account-label"
                value={filters.accountId}
                label="Conta"
                onChange={handleFilterChange('accountId')}
              >
                <MenuItem value="">Todas</MenuItem>
                {accounts.map(account => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.accountNumber} ({account.currency})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <TextField
              label="Valor Mínimo"
              type="number"
              fullWidth
              size="small"
              value={filters.minAmount}
              onChange={handleFilterChange('minAmount')}
              InputProps={{
                startAdornment: 'R$'
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <TextField
              label="Valor Máximo"
              type="number"
              fullWidth
              size="small"
              value={filters.maxAmount}
              onChange={handleFilterChange('maxAmount')}
              InputProps={{
                startAdornment: 'R$'
              }}
            />
          </Grid>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Grid item xs={12} md={6} lg={3}>
              <DatePicker
                label="Data Inicial"
                value={filters.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                format="dd/MM/yyyy"
              />
            </Grid>
            
            <Grid item xs={12} md={6} lg={3}>
              <DatePicker
                label="Data Final"
                value={filters.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                format="dd/MM/yyyy"
              />
            </Grid>
          </LocalizationProvider>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearOutlined />}
              onClick={clearFilters}
            >
              Limpar
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<FilterAltOutlined />}
              onClick={applyFilters}
            >
              Aplicar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Conta</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>{transaction._id}</TableCell>
                        <TableCell>
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{getTypeChip(transaction.type)}</TableCell>
                        <TableCell>
                          {transaction.accountId?.accountNumber || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {transaction.userId ? 
                            `${transaction.userId.firstName} ${transaction.userId.lastName}` : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color={transaction.amount < 0 ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(transaction.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  )}
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
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TransactionsReport;
