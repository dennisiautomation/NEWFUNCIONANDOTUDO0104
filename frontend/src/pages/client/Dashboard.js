import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon,
  ReceiptLong as ReceiptIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  SwapHoriz as SwapIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useSelector } from 'react-redux';

// URL da API baseada no ambiente (produção ou desenvolvimento)
const getAPIURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'global.newcashbank.com.br') {
    return 'https://global.newcashbank.com.br/api';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  } else {
    // Caso de desenvolvimento ou teste em outros ambientes
    return process.env.REACT_APP_API_URL || window.location.origin + '/api';
  }
};

const API_URL = getAPIURL();

// Obter o token do localStorage com tratamento de erro
const getToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("Token não encontrado no localStorage");
      return null;
    }
    return token;
  } catch (error) {
    console.error("Erro ao obter token:", error);
    return null;
  }
};

// Componente estilizado para os cards de conta
const AccountCard = styled(Card)(({ theme, currency }) => ({
  position: 'relative',
  overflow: 'visible',
  height: '100%',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10]
  },
  background: currency === 'USD' 
    ? 'linear-gradient(135deg, #1976d2, #64b5f6)' 
    : currency === 'EUR'
      ? 'linear-gradient(135deg, #7b1fa2, #ba68c8)'
      : 'linear-gradient(135deg, #ff9800, #ffd54f)',
  color: '#fff'
}));

const CurrencyIcon = ({ currency }) => {
  switch (currency) {
    case 'USD':
      return <span style={{ fontSize: '28px', marginRight: '8px' }}>$</span>;
    case 'EUR':
      return <span style={{ fontSize: '28px', marginRight: '8px' }}>€</span>;
    case 'USDT':
      return <span style={{ fontSize: '28px', marginRight: '8px' }}>₮</span>;
    default:
      return null;
  }
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const [activeTab, setActiveTab] = useState(0);
  const [operationDialog, setOperationDialog] = useState({
    open: false,
    type: '',
    title: ''
  });
  
  const [operationForm, setOperationForm] = useState({
    accountId: '',
    amount: '',
    description: '',
    destinationAccountId: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000); // 5 segundos de timeout
    
    fetchAccounts();
    
    return () => clearTimeout(timer);
  }, []);
  
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentToken = getToken();
      if (!currentToken) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      console.log('Buscando contas em:', API_URL);
      const response = await axios.get(`${API_URL}/accounts/my-accounts?_=${new Date().getTime()}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        },
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (response.data.status === 'success') {
        console.log('Contas retornadas pela API:', response.data.data);
        const accountsData = response.data.data || [];
        
        // Normalizar dados das contas para garantir consistência
        const normalizedAccounts = accountsData.map(account => ({
          id: account.id || account._id,
          name: account.name || account.accountName || account.accountNumber || `Conta ${account.currency || 'USD'}`,
          accountNumber: account.accountNumber || account.number || '0000',
          balance: account.balance || 0,
          currency: account.currency || 'USD',
          status: account.status || 'active',
          userId: account.userId || account.user_id
        }));
        
        console.log('Contas normalizadas:', normalizedAccounts);
        setAccounts(normalizedAccounts);
        
        if (normalizedAccounts && normalizedAccounts.length > 0) {
          const defaultAccount = normalizedAccounts[0];
          setSelectedAccount(defaultAccount);
          
          // Verificar se o ID da conta existe antes de buscar transações
          if (defaultAccount && defaultAccount.id) {
            fetchTransactions(defaultAccount.id);
          } else {
            setTransactions([]);
          }
        } else {
          console.warn('Nenhuma conta encontrada para o usuário');
          setAccounts([]);
          setSelectedAccount(null);
          setTransactions([]);
        }
      } else {
        throw new Error(response.data.message || 'Erro ao carregar contas');
      }
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
      
      // Mensagens de erro mais específicas baseadas no tipo de erro
      if (err.code === 'ECONNABORTED') {
        setError('Tempo esgotado ao tentar conectar ao servidor. Verifique sua conexão.');
      } else if (err.response) {
        // O servidor respondeu com um código de status diferente de 2xx
        if (err.response.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          // Redirecionar para a página de login
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          setError(`Erro do servidor: ${err.response.data.message || err.response.statusText}`);
        }
      } else if (err.request) {
        // A requisição foi feita mas não recebemos resposta
        setError('Não foi possível conectar ao servidor. Verifique sua conexão de internet.');
      } else {
        // Algo aconteceu na configuração da requisição que causou o erro
        setError(err.message || 'Ocorreu um erro ao carregar seus dados');
      }
      
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTransactions = async (accountId) => {
    try {
      // Verificar se o ID da conta é válido
      if (!accountId) {
        console.log('ID da conta inválido para buscar transações');
        setTransactions([]);
        return;
      }
      
      setRefreshing(true);
      
      const currentToken = getToken();
      if (!currentToken) {
        console.warn("Token não encontrado. Ignorando busca de transações.");
        setTransactions([]);
        setRefreshing(false);
        return;
      }
      
      console.log('Buscando transações para conta:', accountId);
      try {
        const response = await axios.get(`${API_URL}/transactions/account/${accountId}?_=${new Date().getTime()}`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          },
          timeout: 10000 // 10 segundos de timeout
        });
        
        if (response.data.status === 'success') {
          setTransactions(response.data.data || []);
        } else {
          // Ignora o erro e apenas mostra um array vazio
          console.warn('API retornou status não sucesso:', response.data.message);
          setTransactions([]);
        }
      } catch (apiError) {
        // Em caso de erro 401, apenas mostre um array vazio
        if (apiError.response && apiError.response.status === 401) {
          console.warn('Erro de autenticação ao buscar transações. Exibindo lista vazia.');
          setTransactions([]);
        } else {
          console.error('Erro ao buscar transações:', apiError);
          setError('Não foi possível carregar as transações. Tente novamente mais tarde.');
        }
        setTransactions([]);
      }
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    fetchTransactions(account.id);
  };
  
  const handleOpenOperation = (type) => {
    let title = '';
    
    switch (type) {
      case 'deposit':
        title = 'Realizar Depósito';
        break;
      case 'withdraw':
        title = 'Realizar Saque';
        break;
      case 'transfer':
        title = 'Realizar Transferência';
        break;
      default:
        title = 'Operação';
    }
    
    setOperationDialog({
      open: true,
      type,
      title
    });
    
    setOperationForm({
      accountId: selectedAccount.id,
      amount: '',
      description: '',
      destinationAccountId: ''
    });
    
    setFormErrors({});
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setOperationForm({
      ...operationForm,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateOperationForm = () => {
    const errors = {};
    
    if (!operationForm.amount || isNaN(operationForm.amount) || parseFloat(operationForm.amount) <= 0) {
      errors.amount = 'Valor deve ser maior que zero';
    }
    
    if (operationDialog.type === 'transfer' && !operationForm.destinationAccountId) {
      errors.destinationAccountId = 'Selecione uma conta de destino';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmitOperation = async () => {
    if (!validateOperationForm()) return;
    
    setRefreshing(true);
    
    try {
      let response;
      const { type } = operationDialog;
      const amount = parseFloat(operationForm.amount);
      
      if (type === 'deposit') {
        response = await axios.post(`${API_URL}/internal/accounts/${selectedAccount.id}/deposit`, {
          amount,
          description: operationForm.description || 'Depósito'
        }, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
      } else if (type === 'withdraw') {
        response = await axios.post(`${API_URL}/internal/accounts/${selectedAccount.id}/withdraw`, {
          amount,
          description: operationForm.description || 'Saque'
        }, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
      } else if (type === 'transfer') {
        response = await axios.post(`${API_URL}/internal/accounts/${selectedAccount.id}/transfer`, {
          amount,
          destinationAccountId: operationForm.destinationAccountId,
          description: operationForm.description || 'Transferência'
        }, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
      }
      
      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: `${operationDialog.title} realizado com sucesso!`,
          severity: 'success'
        });
        
        setOperationDialog({
          open: false,
          type: '',
          title: ''
        });
        fetchAccounts(); // Atualizar saldos
        
        if (selectedAccount) {
          fetchTransactions(selectedAccount.id); // Atualizar transações
        }
      } else {
        throw new Error(response.data.message || `Erro ao realizar ${operationDialog.title.toLowerCase()}`);
      }
    } catch (err) {
      console.error(`Erro na operação de ${operationDialog.type}:`, err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Erro ao processar operação',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
  
  const renderTransactionInfo = (transaction) => {
    let icon;
    let description = transaction.description;
    
    switch (transaction.type.toLowerCase()) {
      case 'deposit':
        icon = <UpIcon color="success" />;
        break;
      case 'withdrawal':
        icon = <DownIcon color="error" />;
        break;
      case 'transfer':
        icon = <SwapIcon color="primary" />;
        break;
      default:
        icon = null;
    }
    
    return (
      <>
        {icon}
        <Typography variant="body2" sx={{ ml: 1 }}>
          {description}
        </Typography>
      </>
    );
  };
  
  // Função segura para formatar moeda
  const formatCurrency = (value, currencyCode) => {
    try {
      // Lista de códigos de moeda válidos
      const validCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];
      
      // Verificar se o valor e código da moeda são válidos
      if (value === undefined || value === null) {
        return '0.00';
      }
      
      // Se a moeda for USDT ou não for válida, usar BRL como fallback
      let currency = currencyCode;
      if (!currency || !validCurrencies.includes(currency)) {
        console.log(`Substituindo código de moeda inválido: ${currency} por BRL`);
        currency = 'BRL';
      }
      
      // Para USDT, usar BRL como moeda para formatação
      if (currency === 'USDT') {
        currency = 'BRL';
      }
      
      const formattedValue = parseFloat(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: currency
      });
      
      // Para USDT, substituir o símbolo R$ por ₮
      if (currencyCode === 'USDT') {
        return formattedValue.replace('R$', '₮');
      }
      
      return formattedValue;
    } catch (error) {
      console.error('Erro ao formatar moeda:', error);
      return `${parseFloat(value || 0).toFixed(2)}`;
    }
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Suas Contas
      </Typography>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Minhas Contas
          </Typography>
          
          {accounts.length === 0 ? (
            <Alert severity="info">
              Você ainda não possui contas. Entre em contato com o suporte para criar suas contas.
            </Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {accounts.map((account) => (
                <Grid item xs={12} md={4} key={account.id}>
                  <AccountCard 
                    currency={account.currency}
                    onClick={() => handleSelectAccount(account)}
                    raised={selectedAccount?.id === account.id}
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedAccount?.id === account.id ? '2px solid #fff' : 'none',
                      backgroundColor: account.currency === 'USD' ? '#E8F5E9' : 
                                      account.currency === 'EUR' ? '#E3F2FD' : 
                                      account.currency === 'USDT' ? '#FFF3E0' : '#F5F5F5',
                      borderLeft: `5px solid ${account.currency === 'USD' ? '#43A047' : 
                                             account.currency === 'EUR' ? '#1976D2' : 
                                             account.currency === 'USDT' ? '#FF9800' : '#757575'}`
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CurrencyIcon currency={account.currency} />
                        <Typography variant="h5" component="div">
                          Conta {account.currency === 'BRL' ? 'USDT' : account.currency}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                        {account.name}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                        Número: {account.accountNumber}
                      </Typography>
                      
                      <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {formatCurrency(account.balance, account.currency)}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-around', pb: 2 }}>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="inherit"
                        startIcon={<DownIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccount(account);
                          handleOpenOperation('deposit');
                        }}
                      >
                        Depositar
                      </Button>
                      
                      <Button 
                        size="small" 
                        variant="contained"
                        color="inherit"
                        startIcon={<UpIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccount(account);
                          handleOpenOperation('withdraw');
                        }}
                      >
                        Sacar
                      </Button>
                      
                      <Button 
                        size="small" 
                        variant="contained"
                        color="inherit"
                        startIcon={<SwapIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccount(account);
                          handleOpenOperation('transfer');
                        }}
                      >
                        Transferir
                      </Button>
                    </CardActions>
                  </AccountCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
      
      {/* Detalhes e transações */}
      {selectedAccount && (
        <Paper sx={{ p: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Detalhes da Conta {selectedAccount.currency === 'BRL' ? 'USDT' : selectedAccount.currency}
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchTransactions(selectedAccount.id)}
              disabled={refreshing}
            >
              Atualizar
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="account tabs"
              variant="fullWidth"
            >
              <Tab label="Transações Recentes" />
              <Tab label="Informações da Conta" />
            </Tabs>
          </Box>
          
          {activeTab === 0 && (
            <Box sx={{ py: 2 }}>
              {refreshing ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : transactions.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  Nenhuma transação encontrada para esta conta.
                </Alert>
              ) : (
                <List>
                  {transactions.map((transaction) => {
                    const transactionInfo = renderTransactionInfo(transaction);
                    
                    return (
                      <ListItem 
                        key={transaction.id}
                        divider
                        sx={{ 
                          borderRadius: '8px', 
                          my: 1,
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        {transactionInfo}
                        
                        <ListItemSecondaryAction>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: transaction.type === 'withdrawal' ? 'error.main' : 'success.main'
                            }}
                          >
                            {transaction.type === 'withdrawal' ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informações da Conta
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Número da Conta:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedAccount && selectedAccount.accountNumber}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Tipo:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedAccount.accountType === 'internal' ? 'Conta Interna' : selectedAccount.accountType}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Moeda:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedAccount.currency === 'BRL' ? 'USDT' : selectedAccount.currency}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Status:
                        </Typography>
                        <Chip 
                          label={selectedAccount.status === 'active' ? 'Ativo' : selectedAccount.status}
                          color={selectedAccount.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Limites da Conta
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Limite Diário de Transferência:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatCurrency(selectedAccount.dailyTransferLimit, selectedAccount.currency)}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Utilizado Hoje:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatCurrency(selectedAccount.dailyTransferTotal, selectedAccount.currency)}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Limite Mensal de Transferência:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatCurrency(selectedAccount.monthlyTransferLimit, selectedAccount.currency)}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Utilizado no Mês:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatCurrency(selectedAccount.monthlyTransferTotal, selectedAccount.currency)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Diálogo de operação (depósito, saque, transferência) */}
      <Dialog
        open={operationDialog.open}
        onClose={() => setOperationDialog({ open: false, type: '', title: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{operationDialog.title}</DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Conta: {selectedAccount?.name} ({selectedAccount?.accountNumber})
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Saldo Atual: {formatCurrency(selectedAccount?.balance, selectedAccount?.currency)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="amount"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={operationForm.amount}
                  onChange={handleFormChange}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  required
                />
              </Grid>
              
              {operationDialog.type === 'transfer' && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.destinationAccountId}>
                    <InputLabel id="destination-account-label">Conta de Destino</InputLabel>
                    <Select
                      labelId="destination-account-label"
                      label="Conta de Destino"
                      name="destinationAccountId"
                      value={operationForm.destinationAccountId}
                      onChange={handleFormChange}
                      required
                    >
                      {accounts && accounts.length > 0 ? (
                        // Mostrar todas as contas EXCETO a conta de origem, priorizando contas com moedas diferentes
                        accounts
                          .filter(account => account.id !== selectedAccount?.id)
                          .sort((a, b) => {
                            // Ordenar para mostrar contas com moedas diferentes primeiro
                            if (a.currency !== selectedAccount?.currency && b.currency === selectedAccount?.currency) return -1;
                            if (a.currency === selectedAccount?.currency && b.currency !== selectedAccount?.currency) return 1;
                            return 0;
                          })
                          .map(account => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.name} ({account.accountNumber}) - {account.currency}
                              {account.currency !== selectedAccount?.currency && (
                                <Chip 
                                  size="small" 
                                  label="Conversão" 
                                  color="primary" 
                                  variant="outlined" 
                                  sx={{ ml: 1, fontSize: '0.7rem' }} 
                                />
                              )}
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem disabled>Nenhuma conta disponível para transferência</MenuItem>
                      )}
                    </Select>
                    {formErrors.destinationAccountId && (
                      <Typography variant="caption" color="error">
                        {formErrors.destinationAccountId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição (opcional)"
                  name="description"
                  value={operationForm.description}
                  onChange={handleFormChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOperationDialog({ open: false, type: '', title: '' })} color="inherit">
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmitOperation}
            variant="contained"
            color="primary"
            disabled={refreshing}
          >
            {refreshing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;