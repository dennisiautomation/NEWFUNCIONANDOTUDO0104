import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PrintIcon from '@mui/icons-material/Print';
import { fetchAccountTransactions, fetchUserTransactions } from '../store/slices/transactionSlice';
import { reservationApi, receivingApi } from '../services/api';

const AccountOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const [accountInfo, setAccountInfo] = useState({
    accountNumber: user?.accountNumber || '',
    currency: 'USD',
    balance: {
      incoming: 0.00,
      outgoing: 0.00,
      total: 0.00
    },
    transactions: [],
    reservations: []
  });

  const getCurrencySymbol = (currency) => {
    switch(currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'USDT':
        return '₮';
      case 'BRL':
        return 'R$';
      default:
        return '';
    }
  };

  const getCurrencyColor = (currency) => {
    switch(currency) {
      case 'USD':
        return 'text-green-600';
      case 'EUR':
        return 'text-blue-600';
      case 'USDT':
        return 'text-teal-600';
      case 'BRL':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // Função para buscar saldo e transações
  const fetchAccountData = async () => {
    if (!user?.accountNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Buscar transações da conta
      const transactions = await dispatch(fetchAccountTransactions({
        accountId: user.accountNumber,
        params: dateRange
      })).unwrap();

      // 2. Buscar transferências recebidas
      const incomingTransfers = await receivingApi.getIncomingTransfers(user.accountNumber);

      // 3. Buscar reservas ativas
      const usdReservations = await reservationApi.getUSDReservations();
      const eurReservations = await reservationApi.getEURReservations();
      const brlReservations = await reservationApi.getBRLReservations();
      
      // Calcular saldos
      const incoming = incomingTransfers.reduce((total, transfer) => total + Number(transfer.amount), 0);
      const outgoing = transactions.reduce((total, tx) => total + (tx.type === 'debit' ? Number(tx.amount) : 0), 0);
      
      setAccountInfo({
        accountNumber: user.accountNumber,
        currency: 'USD',
        balance: {
          incoming,
          outgoing,
          total: incoming - outgoing
        },
        transactions: [...transactions],
        reservations: [...usdReservations, ...eurReservations, ...brlReservations].filter(res => 
          res.account === user.accountNumber
        )
      });
    } catch (err) {
      setError('Erro ao carregar dados da conta. Por favor, tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados quando o componente montar ou quando o usuário mudar
  useEffect(() => {
    fetchAccountData();
  }, [user?.accountNumber]);

  // Buscar dados quando o filtro de data mudar
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAccountData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const handlePrint = (type) => {
    // Implementar lógica de impressão
    console.log(`Imprimindo ${type}`, accountInfo);
  };

  if (!user?.accountNumber) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">
          Por favor, faça login para ver as informações da sua conta.
        </Alert>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Visão Geral da Conta
        </Typography>
        <Typography variant="subtitle1">
          {getCurrencySymbol(accountInfo.currency)} {accountInfo.accountNumber}
        </Typography>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => handlePrint('overview')}
            fullWidth
          >
            Imprimir Visão Geral
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => handlePrint('details')}
            fullWidth
          >
            Imprimir Detalhes
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/new-transfer'}
            fullWidth
          >
            Nova Transferência
          </Button>
        </Grid>
      </Grid>

      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Data Inicial"
                value={dateRange.startDate}
                onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Data Final"
                value={dateRange.endDate}
                onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ bgcolor: 'primary.main', color: 'white', p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">
              {accountInfo.transactions.length} Transferências | {getCurrencySymbol(accountInfo.currency)} {accountInfo.accountNumber}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography className={getCurrencyColor(accountInfo.currency)}>
              Total Recebido (Crédito): {getCurrencySymbol(accountInfo.currency)} {accountInfo.balance.incoming.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography className={getCurrencyColor(accountInfo.currency)}>
              Total Enviado (Débito): {getCurrencySymbol(accountInfo.currency)} {accountInfo.balance.outgoing.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography className={getCurrencyColor(accountInfo.currency)}>
              Saldo Total: {getCurrencySymbol(accountInfo.currency)} {accountInfo.balance.total.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {accountInfo.reservations.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Reservas Ativas
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CÓDIGO</TableCell>
                  <TableCell>MOEDA</TableCell>
                  <TableCell align="right">VALOR</TableCell>
                  <TableCell>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountInfo.reservations.map((reservation, index) => (
                  <TableRow key={index}>
                    <TableCell>{reservation.code}</TableCell>
                    <TableCell>{reservation.currency}</TableCell>
                    <TableCell align="right">
                      {getCurrencySymbol(reservation.currency)} {Number(reservation.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{reservation.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>DIREÇÃO</TableCell>
              <TableCell>DATA/HORA</TableCell>
              <TableCell align="right">VALOR</TableCell>
              <TableCell>DESCRIÇÃO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accountInfo.transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.direction}</TableCell>
                <TableCell>{transaction.datetime}</TableCell>
                <TableCell align="right">
                  {getCurrencySymbol(accountInfo.currency)} {Number(transaction.amount).toFixed(2)}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
              </TableRow>
            ))}
            {accountInfo.transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AccountOverview;
