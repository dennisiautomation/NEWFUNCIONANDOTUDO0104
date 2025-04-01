import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Menu,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchUserAccounts,
  fetchAccountById
} from '../../store/slices/accountSlice';
import { fetchAccountTransactions } from '../../store/slices/transactionSlice';
import axios from 'axios';

const AccountDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accountId } = useParams();
  const {
    userAccounts,
    accountDetails,
    accountTransactions,
    loading,
    error
  } = useSelector((state) => state.accounts);
  
  const [statementMenuAnchor, setStatementMenuAnchor] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // 1 mês atrás
    endDate: new Date().toISOString().split('T')[0] // hoje
  });
  
  // Buscar dados ao montar o componente
  useEffect(() => {
    // Buscar contas do usuário
    dispatch(fetchUserAccounts());
    
    // Buscar detalhes da conta atual
    if (accountId) {
      dispatch(fetchAccountById(accountId));
    }
    
    // Buscar transações recentes
    if (accountId) {
      dispatch(fetchAccountTransactions({ 
        accountId: accountId,
        params: { limit: 5 }
      }));
    }
  }, [dispatch, accountId]);
  
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
  
  // Navegar para transferência
  const handleTransfer = () => {
    navigate('/transfer');
  };
  
  // Navegar para histórico
  const handleViewHistory = () => {
    navigate(`/history?accountId=${accountId}`);
  };
  
  // Abrir menu de extratos
  const handleStatementMenuOpen = (event) => {
    setStatementMenuAnchor(event.currentTarget);
  };
  
  // Fechar menu de extratos
  const handleStatementMenuClose = () => {
    setStatementMenuAnchor(null);
  };
  
  // Visualizar extrato online
  const handleViewStatement = () => {
    handleStatementMenuClose();
    navigate(`/statements/accounts/${accountId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
  };
  
  // Baixar extrato em PDF
  const handleDownloadPdf = async () => {
    handleStatementMenuClose();
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        url: `/api/statements/accounts/${accountId}/pdf?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_${accountDetails.accountNumber}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Erro ao baixar extrato:', error);
    }
  };
  
  // Visualizar resumo financeiro
  const handleViewSummary = () => {
    handleStatementMenuClose();
    navigate('/statements/summary');
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Detalhes da Conta
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Saldo e Ações Rápidas */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : accountDetails ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Conta {accountDetails.accountType}
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(accountDetails.balance, accountDetails.accountType)}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Tooltip title="Atualizar">
                      <IconButton
                        onClick={() => {
                          if (accountId) {
                            dispatch(fetchAccountById(accountId));
                            dispatch(fetchAccountTransactions({ 
                              accountId: accountId,
                              params: { limit: 5 }
                            }));
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SwapHorizIcon />}
                      onClick={handleTransfer}
                      size="large"
                    >
                      Transferir
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      onClick={handleViewHistory}
                      size="large"
                    >
                      Histórico
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ReceiptIcon />}
                      onClick={handleStatementMenuOpen}
                      size="large"
                    >
                      Extratos
                    </Button>
                    <Menu
                      anchorEl={statementMenuAnchor}
                      open={Boolean(statementMenuAnchor)}
                      onClose={handleStatementMenuClose}
                    >
                      <MenuItem onClick={handleViewStatement}>
                        <ListItemIcon>
                          <HistoryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Ver Extrato Online</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={handleDownloadPdf}>
                        <ListItemIcon>
                          <PdfIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Baixar Extrato PDF</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={handleViewSummary}>
                        <ListItemIcon>
                          <InfoIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Resumo Financeiro</ListItemText>
                      </MenuItem>
                    </Menu>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography>Nenhum dado disponível</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Limites */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Limites
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : accountDetails ? (
              <List>
                <ListItem>
                  <ListItemText
                    primary="Limite Diário"
                    secondary={formatCurrency(accountDetails.dailyLimit, accountDetails.accountType)}
                  />
                  <Typography color="text.secondary">
                    Restante: {formatCurrency(accountDetails.dailyLimitRemaining, accountDetails.accountType)}
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Limite por Transação"
                    secondary={formatCurrency(accountDetails.transactionLimit, accountDetails.accountType)}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography>Nenhum dado disponível</Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Transações Recentes */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Transações Recentes
              </Typography>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={handleViewHistory}
              >
                Ver Todas
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : accountTransactions && accountTransactions.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accountTransactions.map((transaction) => (
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
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                Nenhuma transação recente encontrada
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function para obter ícone do tipo de transação
const getTransactionTypeIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'deposit':
      return <TrendingUpIcon />;
    case 'withdrawal':
      return <TrendingDownIcon />;
    case 'transfer':
      return <SwapHorizIcon />;
    default:
      return <ScheduleIcon />;
  }
};

// Helper function para obter cor do tipo de transação
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

// Helper function para obter cor do status
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

export default AccountDetails;
