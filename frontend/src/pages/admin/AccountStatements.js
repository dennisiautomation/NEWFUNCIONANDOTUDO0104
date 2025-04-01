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
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { 
  FileDownloadOutlined, 
  FilterAltOutlined,
  ClearOutlined,
  AccountBalanceOutlined,
  ReceiptOutlined,
  BarChartOutlined
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL, STATEMENTS_API_URL, ADMIN_REPORTS_API_URL } from '../../config';
import { format } from 'date-fns';

const AccountStatements = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  useEffect(() => {
    if (selectedAccount) {
      fetchAccountStatement();
      fetchFinancialSummary();
    }
  }, [selectedAccount, dateRange.startDate, dateRange.endDate]);
  
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setAccounts(response.data.data);
        
        // Se houver contas, seleciona a primeira por padrão
        if (response.data.data.length > 0) {
          setSelectedAccount(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Não foi possível carregar as contas');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAccountStatement = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    try {
      // Construir query params
      const queryParams = new URLSearchParams();
      
      if (dateRange.startDate) {
        queryParams.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
      }
      
      if (dateRange.endDate) {
        queryParams.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
      }
      
      const response = await axios.get(`${STATEMENTS_API_URL}/accounts/${selectedAccount}?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar extrato:', error);
      toast.error('Não foi possível carregar o extrato');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFinancialSummary = async () => {
    if (!selectedAccount) return;
    
    try {
      // Construir query params
      const queryParams = new URLSearchParams();
      queryParams.append('accountId', selectedAccount);
      
      if (dateRange.startDate) {
        queryParams.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
      }
      
      if (dateRange.endDate) {
        queryParams.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
      }
      
      const response = await axios.get(`${STATEMENTS_API_URL}/summary?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setFinancialSummary(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      toast.error('Não foi possível carregar o resumo financeiro');
    }
  };
  
  const downloadPdfStatement = async () => {
    if (!selectedAccount) return;
    
    try {
      // Construir query params
      const queryParams = new URLSearchParams();
      
      if (dateRange.startDate) {
        queryParams.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
      }
      
      if (dateRange.endDate) {
        queryParams.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
      }
      
      const response = await axios.get(`${STATEMENTS_API_URL}/accounts/${selectedAccount}/pdf?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obter informações da conta selecionada
      const selectedAccountData = accounts.find(acc => acc._id === selectedAccount);
      const accountNumber = selectedAccountData ? selectedAccountData.accountNumber : 'account';
      
      link.setAttribute('download', `statement-${accountNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Extrato baixado com sucesso');
    } catch (error) {
      console.error('Erro ao baixar extrato em PDF:', error);
      toast.error('Não foi possível baixar o extrato');
    }
  };
  
  const handleAccountChange = (event) => {
    setSelectedAccount(event.target.value);
  };
  
  const handleDateChange = (field) => (date) => {
    setDateRange({
      ...dateRange,
      [field]: date
    });
  };
  
  const clearFilters = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
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
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Extratos Bancários
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="account-label">Conta</InputLabel>
              <Select
                labelId="account-label"
                value={selectedAccount}
                label="Conta"
                onChange={handleAccountChange}
              >
                {accounts.map(account => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.accountNumber} - {account.currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Data Inicial"
                value={dateRange.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                format="dd/MM/yyyy"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Data Final"
                value={dateRange.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                format="dd/MM/yyyy"
              />
            </Grid>
          </LocalizationProvider>
          
          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearOutlined />}
              onClick={clearFilters}
              fullWidth
            >
              Limpar
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadOutlined />}
              onClick={downloadPdfStatement}
              fullWidth
              disabled={!selectedAccount}
            >
              PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {financialSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceOutlined color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Saldo Atual</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {formatCurrency(financialSummary.currentBalance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptOutlined color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total de Entradas</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(financialSummary.totalDeposits)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptOutlined color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total de Saídas</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(financialSummary.totalWithdrawals)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Transações
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>{getTypeChip(transaction.type)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={transaction.amount < 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default AccountStatements;
