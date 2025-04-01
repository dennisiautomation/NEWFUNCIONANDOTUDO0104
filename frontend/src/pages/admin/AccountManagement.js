import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';

const AccountManagement = () => {
  // Estados para armazenar dados
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estados locais
  const [dialogMode, setDialogMode] = useState('create'); // create, edit
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  
  // Estado do formulário
  const defaultFormData = {
    name: '',
    email: '',
    documentType: 'CPF',
    documentNumber: '',
    password: '',
    accountNumber: '',
    currency: 'USD',
    status: 'active'
  };
  const [formData, setFormData] = useState(defaultFormData);
  
  // Estado para erros do formulário
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  // Função para buscar contas
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${window.ENV.API_URL}/admin/accounts`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setAccounts(data.data);
      } else {
        throw new Error(data.message || 'Erro ao buscar contas');
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      setSnackbar({
        open: true,
        message: `Erro ao buscar contas: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (dialogMode === 'create') {
      if (!formData.name.trim()) {
        errors.name = 'Nome/Razão Social é obrigatório';
      }
      
      if (!formData.email.trim() || !formData.email.includes('@')) {
        errors.email = 'Email inválido';
      }
      
      if (!formData.documentType.trim()) {
        errors.documentType = 'Tipo de documento é obrigatório';
      }
      
      if (!formData.documentNumber.trim()) {
        errors.documentNumber = 'Número do documento é obrigatório';
      }
      
      if (!formData.password.trim() || formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
    } else {
      // Para edição de contas existentes
      if (!formData.accountNumber.trim()) {
        errors.accountNumber = 'Número da conta é obrigatório';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Abrir diálogo para criar/editar conta
  const handleOpenDialog = (mode, account) => {
    setDialogMode(mode);
    setFormErrors({});
    
    if (mode === 'edit' && account) {
      // Buscar informações completas do cliente e suas contas
      const userAccounts = accounts.find(
        client => client.userId === account.userId
      );
      
      setSelectedAccount(userAccounts);
      // Preencher formulário com dados do cliente e conta
      setFormData({
        userId: userAccounts.userId,
        userName: userAccounts.userName,
        email: userAccounts.userEmail,
        documentType: userAccounts.documentType || 'CPF',
        documentNumber: userAccounts.documentNumber || '',
        password: '', // Campo vazio para senha, será preenchido apenas se for alterar
        userStatus: userAccounts.status || 'active',
        isAdmin: userAccounts.isAdmin || false,
        requireTwoFactor: userAccounts.requireTwoFactor || false,
        restrictTransactions: userAccounts.restrictTransactions || false
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        name: '',
        email: '',
        documentType: 'CPF',
        documentNumber: '',
        password: ''
      });
    }
    setOpenDialog(true);
  };

  // Função para alterar o status de uma conta específica
  const handleAccountStatusChange = (accountId, newStatus) => {
    if (!selectedAccount) return;
    
    const updatedAccounts = selectedAccount.accounts.map(account => {
      if (account.id === accountId) {
        return { ...account, status: newStatus };
      }
      return account;
    });
    
    setSelectedAccount({
      ...selectedAccount,
      accounts: updatedAccounts
    });
  };
  
  // Função para atualizar campos de uma conta específica
  const handleAccountFieldChange = (accountId, fieldName, value) => {
    if (!selectedAccount) return;
    
    const updatedAccounts = selectedAccount.accounts.map(account => {
      if (account.id === accountId) {
        return { ...account, [fieldName]: value };
      }
      return account;
    });
    
    setSelectedAccount({
      ...selectedAccount,
      accounts: updatedAccounts
    });
  };
  
  // Função para ajustar saldo (depósito ou saque)
  const handleAdjustBalance = async (accountId, operationType) => {
    if (!selectedAccount) return;
    
    const account = selectedAccount.accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const amount = parseFloat(account.transactionAmount || 0);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Por favor, informe um valor válido maior que zero',
        severity: 'error'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const operation = operationType === 'deposit' ? 'deposit' : 'withdraw';
      const response = await fetch(`${window.ENV.API_URL}/admin/accounts/${accountId}/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Atualizar o saldo na interface
        const updatedAccounts = selectedAccount.accounts.map(acc => {
          if (acc.id === accountId) {
            const newBalance = operationType === 'deposit' 
              ? acc.balance + amount 
              : acc.balance - amount;
            
            return { 
              ...acc, 
              balance: newBalance,
              transactionAmount: ''  // Limpar o campo após a operação
            };
          }
          return acc;
        });
        
        setSelectedAccount({
          ...selectedAccount,
          accounts: updatedAccounts
        });
        
        // Atualizar a lista de contas principal
        fetchAccounts();
        
        setSnackbar({
          open: true,
          message: `${operationType === 'deposit' ? 'Depósito' : 'Saque'} realizado com sucesso!`,
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Erro ao processar operação');
      }
    } catch (error) {
      console.error('Erro ao ajustar saldo:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao processar operação',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Função para revogar todas as sessões do usuário
  const handleResetAccessTokens = async () => {
    if (!selectedAccount || !selectedAccount.userId) return;
    
    const confirmed = window.confirm(
      'Esta ação irá encerrar todas as sessões ativas do usuário, exigindo um novo login. Deseja continuar?'
    );
    
    if (!confirmed) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`${window.ENV.API_URL}/admin/users/${selectedAccount.userId}/reset-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Todas as sessões do usuário foram encerradas com sucesso',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Erro ao revogar sessões');
      }
    } catch (error) {
      console.error('Erro ao revogar sessões:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao revogar sessões',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Função para salvar alterações (create/edit)
  const handleSave = async () => {
    setSubmitting(true);
    
    try {
      if (dialogMode === 'create') {
        // Lógica para criar nova conta
        const response = await fetch(`${window.ENV.API_URL}/admin/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSnackbar({
            open: true,
            message: data.message || 'Conta criada com sucesso!',
            severity: 'success'
          });
          setOpenDialog(false);
          fetchAccounts();
        } else {
          throw new Error(data.message || 'Erro ao criar conta');
        }
      } else {
        // Lógica para editar cliente e contas
        // 1. Atualizar dados do cliente
        const userData = {
          name: formData.userName,
          email: formData.email,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          status: formData.userStatus,
          isAdmin: formData.isAdmin,
          requireTwoFactor: formData.requireTwoFactor,
          restrictTransactions: formData.restrictTransactions
        };
        
        // Adicionar senha apenas se foi preenchida
        if (formData.password) {
          userData.password = formData.password;
        }
        
        const userResponse = await fetch(`${window.ENV.API_URL}/admin/users/${formData.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        if (!userResponse.ok) {
          const userError = await userResponse.json();
          throw new Error(userError.message || 'Erro ao atualizar dados do cliente');
        }
        
        // 2. Atualizar dados das contas
        if (selectedAccount && selectedAccount.accounts) {
          // Para cada conta, atualizar limites e status
          const accountPromises = selectedAccount.accounts.map(account => {
            return fetch(`${window.ENV.API_URL}/admin/accounts/${account.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: account.status,
                dailyLimit: account.dailyLimit,
                monthlyLimit: account.monthlyLimit
              })
            });
          });
          
          await Promise.all(accountPromises);
        }
        
        setSnackbar({
          open: true,
          message: 'Alterações salvas com sucesso!',
          severity: 'success'
        });
        setOpenDialog(false);
        fetchAccounts();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao salvar alterações',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar status da conta
  const handleToggleStatus = async (account) => {
    try {
      const index = accounts.findIndex(acc => acc.id === account.id);
      if (index !== -1) {
        accounts[index].status = account.status === 'active' ? 'inactive' : 'active';
        setAccounts([...accounts]);
        setSnackbar({
          open: true,
          message: 'Status da conta alterado com sucesso!',
          severity: 'success'
        });
      }
    } catch (error) {
      setError(error.message);
      setSnackbar({
        open: true,
        message: 'Erro ao alterar status da conta!',
        severity: 'error'
      });
    }
  };

  // Excluir conta
  const handleDelete = async (account) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        const index = accounts.findIndex(acc => acc.id === account.id);
        if (index !== -1) {
          accounts.splice(index, 1);
          setAccounts([...accounts]);
          setSnackbar({
            open: true,
            message: 'Conta excluída com sucesso!',
            severity: 'success'
          });
        }
      } catch (error) {
        setError(error.message);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir conta!',
          severity: 'error'
        });
      }
    }
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

  // Manipular mudança de filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  // Atualizar a tabela
  const handleRefresh = () => {
    setSubmitting(true);
    // Simular uma chamada de API
    setTimeout(() => {
      setSubmitting(false);
      setSnackbar({
        open: true,
        message: 'Dados atualizados com sucesso!',
        severity: 'success'
      });
    }, 1500);
  };

  // Exportar contas
  const handleExport = () => {
    setSnackbar({
      open: true,
      message: 'Arquivo exportado com sucesso!',
      severity: 'success'
    });
  };

  // Visualizar histórico da conta
  const handleViewHistory = (account) => {
    setSnackbar({
      open: true,
      message: `Exibindo histórico da conta ${account.accountNumber}`,
      severity: 'info'
    });
    
    // Em uma implementação real, abriria um modal ou redirecionaria para uma página de histórico
    console.log(`Histórico da conta ${account.accountNumber}`);
  };

  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    try {
      // Tratamento especial para USDT e outras criptomoedas ou moedas não reconhecidas
      if (currency === 'USDT' || currency === 'USDC' || currency === 'BTC' || currency === 'ETH') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount) + ` ${currency}`;
      }
      
      // Para moedas tradicionais reconhecidas
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    } catch (error) {
      console.warn(`Erro ao formatar moeda ${currency}:`, error);
      // Fallback seguro para qualquer erro de formatação
      return `${parseFloat(amount).toFixed(2)} ${currency || 'USD'}`;
    }
  };

  // Diálogo de criar/editar conta
  const renderDialog = () => {
    return (
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth={dialogMode === 'edit' ? "md" : "sm"}
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Criar Nova Conta' : 'Gerenciamento Avançado de Cliente'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            {dialogMode === 'create' ? (
              // Campos para criar nova conta
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Dados do Cliente
                </Typography>
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Nome / Razão Social"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  autoFocus
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl 
                      fullWidth 
                      margin="normal"
                      required
                    >
                      <InputLabel>Tipo de Documento</InputLabel>
                      <Select
                        name="documentType"
                        value={formData.documentType || 'CPF'}
                        onChange={handleChange}
                      >
                        <MenuItem value="CPF">CPF</MenuItem>
                        <MenuItem value="CNPJ">CNPJ</MenuItem>
                        <MenuItem value="PASSPORT">Passaporte</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Número do Documento"
                      name="documentNumber"
                      value={formData.documentNumber || ''}
                      onChange={handleChange}
                      error={!!formErrors.documentNumber}
                      helperText={formErrors.documentNumber}
                    />
                  </Grid>
                </Grid>
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Senha"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Ao criar uma conta, três contas serão geradas automaticamente nas moedas USD, EUR e USDT.
                </Typography>
              </>
            ) : (
              // Campos para editar cliente e contas existentes - GERENCIAMENTO AVANÇADO
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {selectedAccount?.userName || 'Cliente'}
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {/* Coluna 1: Dados do Cliente */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Dados do Cliente
                      </Typography>
                      
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Nome / Razão Social"
                        name="userName"
                        value={formData.userName || ''}
                        onChange={handleChange}
                      />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth margin="normal">
                            <InputLabel>Tipo de Documento</InputLabel>
                            <Select
                              name="documentType"
                              value={formData.documentType || 'CPF'}
                              onChange={handleChange}
                            >
                              <MenuItem value="CPF">CPF</MenuItem>
                              <MenuItem value="CNPJ">CNPJ</MenuItem>
                              <MenuItem value="PASSPORT">Passaporte</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            margin="normal"
                            fullWidth
                            label="Número do Documento"
                            name="documentNumber"
                            value={formData.documentNumber || ''}
                            onChange={handleChange}
                          />
                        </Grid>
                      </Grid>
                      
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                      />
                      
                      <TextField
                        margin="normal"
                        fullWidth
                        label="Nova Senha (deixe em branco para não alterar)"
                        name="password"
                        type="password"
                        value={formData.password || ''}
                        onChange={handleChange}
                      />
                      
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">Status do Acesso</Typography>
                        <FormControl component="fieldset">
                          <Select
                            name="userStatus"
                            value={formData.userStatus || 'active'}
                            onChange={handleChange}
                            size="small"
                          >
                            <MenuItem value="active">Ativo</MenuItem>
                            <MenuItem value="blocked">Bloqueado</MenuItem>
                            <MenuItem value="suspended">Suspenso</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">Acesso Administrativo</Typography>
                        <Switch
                          name="isAdmin"
                          checked={formData.isAdmin || false}
                          onChange={(e) => handleChange({
                            target: {
                              name: 'isAdmin',
                              value: e.target.checked
                            }
                          })}
                          color="primary"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Coluna 2: Gerenciamento de Contas e Saldos */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Gerenciamento de Contas e Saldos
                      </Typography>
                      
                      {/* Contas do cliente */}
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>Contas</Typography>
                      
                      {selectedAccount?.accounts?.map((account, index) => (
                        <Box key={account.id} sx={{ mt: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                <Chip 
                                  label={account.currency} 
                                  size="small" 
                                  color={
                                    account.currency === 'USD' ? 'primary' : 
                                    account.currency === 'EUR' ? 'secondary' : 'success'
                                  }
                                  sx={{ mr: 1 }}
                                />
                                {account.accountNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Saldo: {formatCurrency(account.balance, account.currency)}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id={`status-label-${index}`}>Status</InputLabel>
                                <Select
                                  labelId={`status-label-${index}`}
                                  value={account.status || 'active'}
                                  onChange={(e) => handleAccountStatusChange(account.id, e.target.value)}
                                  label="Status"
                                  size="small"
                                >
                                  <MenuItem value="active">Ativo</MenuItem>
                                  <MenuItem value="blocked">Bloqueado</MenuItem>
                                  <MenuItem value="frozen">Congelado</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <TextField
                              label="Valor"
                              type="number"
                              size="small"
                              value={account.transactionAmount || ''}
                              onChange={(e) => handleAccountFieldChange(account.id, 'transactionAmount', e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">{account.currency}</InputAdornment>,
                              }}
                              sx={{ width: '40%' }}
                            />
                            
                            <Button 
                              variant="outlined" 
                              color="success" 
                              size="small"
                              onClick={() => handleAdjustBalance(account.id, 'deposit')}
                              sx={{ flexGrow: 1, fontSize: '0.75rem' }}
                            >
                              Depositar
                            </Button>
                            
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              onClick={() => handleAdjustBalance(account.id, 'withdraw')}
                              sx={{ flexGrow: 1, fontSize: '0.75rem' }}
                            >
                              Sacar
                            </Button>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <TextField
                              label="Limite Diário"
                              type="number"
                              size="small"
                              value={account.dailyLimit || ''}
                              onChange={(e) => handleAccountFieldChange(account.id, 'dailyLimit', e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">{account.currency}</InputAdornment>,
                              }}
                              sx={{ width: '48%', mr: 1 }}
                            />
                            
                            <TextField
                              label="Limite Mensal"
                              type="number"
                              size="small"
                              value={account.monthlyLimit || ''}
                              onChange={(e) => handleAccountFieldChange(account.id, 'monthlyLimit', e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">{account.currency}</InputAdornment>,
                              }}
                              sx={{ width: '48%' }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                    
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Segurança e Controles
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.requireTwoFactor || false}
                                onChange={(e) => handleChange({
                                  target: {
                                    name: 'requireTwoFactor',
                                    value: e.target.checked
                                  }
                                })}
                                color="primary"
                              />
                            }
                            label="Exigir autenticação de dois fatores"
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.restrictTransactions || false}
                                onChange={(e) => handleChange({
                                  target: {
                                    name: 'restrictTransactions',
                                    value: e.target.checked
                                  }
                                })}
                                color="primary"
                              />
                            }
                            label="Restringir transações internacionais"
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            onClick={handleResetAccessTokens}
                            startIcon={<BlockIcon />}
                          >
                            Revogar todas as sessões
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <LoadingButton 
            onClick={handleSave}
            loading={submitting}
            variant="contained"
          >
            {dialogMode === 'create' ? 'Criar' : 'Salvar Alterações'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Contas
      </Typography>
      
      {/* Barra de Ferramentas */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nome, email ou número da conta"
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
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('create')}
              >
                Nova Conta
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
              >
                Exportar
              </Button>
              
              <IconButton
                color="primary"
                onClick={handleRefresh}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de Contas Agrupadas por Cliente */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contas</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data de Criação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">Nenhuma conta encontrada</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar uma nova conta
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{client.userName}</Typography>
                      <Typography variant="body2" color="text.secondary">{client.userEmail}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {client.accounts.map(account => (
                          <Box key={account.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={account.currency}
                              color={
                                account.currency === 'USD' ? 'primary' : 
                                account.currency === 'EUR' ? 'secondary' : 
                                account.currency === 'USDT' ? 'success' : 'default'
                              }
                              size="small"
                              sx={{ minWidth: 60 }}
                            />
                            <Typography variant="body2">{account.accountNumber}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(account.balance, account.currency)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={client.accounts[0]?.status === 'active' ? 'Ativo' : 'Inativo'}
                        color={client.accounts[0]?.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {client.accounts[0] && new Date(client.accounts[0].createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Histórico">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewHistory(client.accounts[0])}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              // Adicionando o ID do usuário à primeira conta (se existir) para facilitar a busca
                              const accountData = client.accounts && client.accounts.length > 0 
                                ? { ...client.accounts[0], userId: client.id } 
                                : { userId: client.id };
                              handleOpenDialog('edit', accountData);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={client.accounts[0]?.status === 'active' ? 'Desativar' : 'Ativar'}>
                          <IconButton
                            size="small"
                            color={client.accounts[0]?.status === 'active' ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(client.accounts[0])}
                          >
                            {client.accounts[0]?.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
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
          count={accounts.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Itens por página"
        />
      </Paper>
      
      {renderDialog()}
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement;
