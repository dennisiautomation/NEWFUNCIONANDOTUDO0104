import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip,
  Snackbar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  AccountBalance as AccountIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  SwapHoriz as SwapIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import { fetchUserAccounts } from '../../store/slices/accountSlice';
import { executeTransfer } from '../../store/slices/transactionSlice';

const TransferFunds = () => {
  const dispatch = useDispatch();
  const { userAccounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { loading: transferLoading, error: transferError } = useSelector((state) => state.transactions);
  
  // Form state
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    transferType: 'internal', // internal, domestic, international
    beneficiaryName: '',
    beneficiaryBank: '',
    beneficiaryAccountNumber: '',
    swiftCode: '',
    description: '',
    transferMethod: 'standard' // standard, express
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [availableBalance, setAvailableBalance] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [isCurrencyConversion, setIsCurrencyConversion] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Fetch accounts on component mount
  useEffect(() => {
    dispatch(fetchUserAccounts());
    // Adicionar log para depuração
    console.log('Buscando contas do usuário...');
  }, [dispatch]);
  
  // Update available balance when from account changes
  useEffect(() => {
    if (formData.fromAccount && userAccounts && userAccounts.length > 0) {
      // Adicionar log para depuração
      console.log('Contas disponíveis:', userAccounts);
      const selectedAccount = userAccounts.find(acc => acc.id === formData.fromAccount);
      if (selectedAccount) {
        setAvailableBalance(selectedAccount.balance);
      }
    }
  }, [formData.fromAccount, userAccounts]);
  
  // Check if currency conversion is needed when accounts change
  useEffect(() => {
    if (formData.fromAccount && formData.toAccount && userAccounts && userAccounts.length > 0) {
      const sourceAccount = userAccounts.find(acc => acc.id === formData.fromAccount);
      const targetAccount = userAccounts.find(acc => acc.id === formData.toAccount);
      
      if (sourceAccount && targetAccount) {
        const needsConversion = sourceAccount.currency !== targetAccount.currency;
        setIsCurrencyConversion(needsConversion);
        
        // Reset conversion data if no conversion needed
        if (!needsConversion) {
          setExchangeRate(null);
          setConvertedAmount(null);
        } else if (formData.amount) {
          // Simulate conversion if amount is available
          simulateConversion();
        }
      }
    }
  }, [formData.fromAccount, formData.toAccount, userAccounts]);
  
  // Simulate currency conversion
  const simulateConversion = async () => {
    if (!formData.fromAccount || !formData.toAccount || !formData.amount) {
      return;
    }
    
    const sourceAccount = userAccounts.find(acc => acc.id === formData.fromAccount);
    const targetAccount = userAccounts.find(acc => acc.id === formData.toAccount);
    
    if (!sourceAccount || !targetAccount) {
      return;
    }
    
    const sourceCurrency = sourceAccount.currency;
    const targetCurrency = targetAccount.currency;
    
    // Only simulate if currencies are different
    if (sourceCurrency === targetCurrency) {
      setConvertedAmount(parseFloat(formData.amount));
      setExchangeRate(1);
      return;
    }
    
    setIsSimulating(true);
    
    try {
      // Adicionar logging para depuração
      console.log(`Simulando conversão de ${sourceCurrency} para ${targetCurrency}`);
      
      const response = await fetch(`${window.ENV.API_URL}/currency-transfer/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fromCurrency: sourceCurrency,
          toCurrency: targetCurrency,
          amount: parseFloat(formData.amount)
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao simular conversão');
      }
      
      const data = await response.json();
      
      // Adicionar mais logging para depuração
      console.log('Resultado da simulação:', data);
      
      setExchangeRate(data.rate);
      setConvertedAmount(data.convertedAmount);
      
      // Atualizar snackbar para mostrar informação de conversão
      setSnackbar({
        open: true,
        message: `Taxa de conversão: 1 ${sourceCurrency} = ${data.rate.toFixed(4)} ${targetCurrency}`,
        severity: 'info'
      });
      
    } catch (error) {
      console.error('Erro ao simular conversão:', error);
      
      // Usar dados fixos como fallback se a API falhar
      // Em ambiente de produção, seria melhor mostrar uma mensagem de erro
      const fallbackRates = {
        'USD_EUR': 0.93,
        'EUR_USD': 1.08,
        'USD_BRL': 5.23,
        'BRL_USD': 0.19,
        'EUR_BRL': 5.63,
        'BRL_EUR': 0.18
      };
      
      const rateKey = `${sourceCurrency}_${targetCurrency}`;
      const fallbackRate = fallbackRates[rateKey] || 1;
      const fallbackAmount = parseFloat(formData.amount) * fallbackRate;
      
      setExchangeRate(fallbackRate);
      setConvertedAmount(fallbackAmount);
      
      setSnackbar({
        open: true,
        message: `Taxa de conversão (aproximada): 1 ${sourceCurrency} = ${fallbackRate.toFixed(4)} ${targetCurrency}`,
        severity: 'warning'
      });
    } finally {
      setIsSimulating(false);
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fromAccount) {
      errors.fromAccount = 'Por favor, selecione a conta de origem';
    }
    
    if (!formData.toAccount && formData.transferType === 'internal') {
      errors.toAccount = 'Por favor, selecione a conta de destino';
    }
    
    if (formData.transferType !== 'internal') {
      if (!formData.beneficiaryName) {
        errors.beneficiaryName = 'Nome do beneficiário é obrigatório';
      }
      if (!formData.beneficiaryBank) {
        errors.beneficiaryBank = 'Banco do beneficiário é obrigatório';
      }
      if (!formData.beneficiaryAccountNumber) {
        errors.beneficiaryAccountNumber = 'Número da conta do beneficiário é obrigatório';
      }
      if (formData.transferType === 'international' && !formData.swiftCode) {
        errors.swiftCode = 'Código SWIFT é obrigatório para transferências internacionais';
      }
    }
    
    if (!formData.amount) {
      errors.amount = 'Valor é obrigatório';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Por favor, insira um valor válido';
    } else if (parseFloat(formData.amount) > availableBalance) {
      errors.amount = 'Saldo insuficiente';
    }
    
    if (!formData.description) {
      errors.description = 'Por favor, forneça uma descrição para esta transferência';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Se for transferência entre contas com moedas diferentes
      if (isCurrencyConversion) {
        try {
          const response = await fetch(`${window.ENV.API_URL}/currency-transfer/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              fromAccountId: formData.fromAccount,
              toAccountId: formData.toAccount,
              amount: parseFloat(formData.amount),
              description: formData.description
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Atualizar contas após transferência bem-sucedida
            dispatch(fetchUserAccounts());
            
            // Resetar formulário
            setFormData({
              fromAccount: '',
              toAccount: '',
              amount: '',
              transferType: 'internal',
              beneficiaryName: '',
              beneficiaryBank: '',
              beneficiaryAccountNumber: '',
              swiftCode: '',
              description: '',
              transferMethod: 'standard'
            });
            
            // Mostrar mensagem de sucesso
            setSnackbar({
              open: true,
              message: 'Transferência realizada com sucesso!',
              severity: 'success'
            });
          } else {
            setSnackbar({
              open: true,
              message: data.message || 'Erro ao processar transferência',
              severity: 'error'
            });
          }
        } catch (error) {
          console.error('Erro ao processar transferência:', error);
          setSnackbar({
            open: true,
            message: 'Erro ao processar transferência',
            severity: 'error'
          });
        }
      } else {
        // Transferência normal (mesma moeda)
        const transferData = {
          ...formData,
          amount: parseFloat(formData.amount)
        };
        
        try {
          await dispatch(executeTransfer(transferData)).unwrap();
          // Reset form after successful transfer
          setFormData({
            fromAccount: '',
            toAccount: '',
            amount: '',
            transferType: 'internal',
            beneficiaryName: '',
            beneficiaryBank: '',
            beneficiaryAccountNumber: '',
            swiftCode: '',
            description: '',
            transferMethod: 'standard'
          });
        } catch (error) {
          console.error('Erro na transferência:', error);
        }
      }
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Simulate conversion when amount changes
    if (name === 'amount' && isCurrencyConversion && value) {
      simulateConversion();
    }
  };
  
  // Get available accounts for transfer
  const getAvailableToAccounts = () => {
    if (!formData.fromAccount || !userAccounts || userAccounts.length === 0) {
      console.log('Nenhuma conta disponível para transferência');
      return [];
    }
    
    // Obter a conta de origem selecionada
    const selectedAccount = userAccounts.find(acc => acc.id === formData.fromAccount);
    if (!selectedAccount) {
      console.log('Conta de origem não encontrada:', formData.fromAccount);
      return [];
    }
    
    // Filtrar apenas as contas do mesmo usuário, com moedas diferentes
    const availableAccounts = userAccounts.filter(acc => 
      acc.id !== formData.fromAccount && // Excluir conta de origem
      acc.currency !== selectedAccount.currency // Apenas contas com moedas diferentes
    );
    
    console.log('Contas disponíveis para transferência:', availableAccounts);
    return availableAccounts;
  };
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return '';
    
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'BRL':
        return 'R$';
      default:
        return currency;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transferência
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Transfer Type Selection */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Tipo de Transferência
                </Typography>
                <RadioGroup
                  row
                  name="transferType"
                  value={formData.transferType}
                  onChange={handleChange}
                >
                  <FormControlLabel 
                    value="internal" 
                    control={<Radio />} 
                    label="Transferência Interna" 
                  />
                  <FormControlLabel 
                    value="domestic" 
                    control={<Radio />} 
                    label="Transferência Nacional" 
                  />
                  <FormControlLabel 
                    value="international" 
                    control={<Radio />} 
                    label="Transferência Internacional" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {/* Source Account */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.fromAccount}>
                <InputLabel>Conta de Origem</InputLabel>
                <Select
                  name="fromAccount"
                  value={formData.fromAccount}
                  onChange={handleChange}
                  startAdornment={<AccountIcon sx={{ mr: 1 }} />}
                >
                  {userAccounts && userAccounts.length > 0 ? userAccounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountName || account.accountNumber} - {formatCurrency(account.balance, account.currency)}
                    </MenuItem>
                  )) : (
                    <MenuItem disabled>Nenhuma conta disponível</MenuItem>
                  )}
                </Select>
                {formErrors.fromAccount && (
                  <FormHelperText>{formErrors.fromAccount}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Destination Account (for internal transfers) */}
            {formData.transferType === 'internal' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.toAccount}>
                  <InputLabel>Conta de Destino</InputLabel>
                  <Select
                    name="toAccount"
                    value={formData.toAccount}
                    onChange={handleChange}
                    startAdornment={<AccountIcon sx={{ mr: 1 }} />}
                  >
                    {getAvailableToAccounts().length > 0 ? getAvailableToAccounts().map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.accountName || account.accountNumber} - {account.currency}
                      </MenuItem>
                    )) : (
                      <MenuItem disabled>Nenhuma conta disponível para transferência</MenuItem>
                    )}
                  </Select>
                  {formErrors.toAccount && (
                    <FormHelperText>{formErrors.toAccount}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            {/* Beneficiary Details (for external transfers) */}
            {formData.transferType !== 'internal' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Beneficiário"
                    name="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={handleChange}
                    error={!!formErrors.beneficiaryName}
                    helperText={formErrors.beneficiaryName}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Banco do Beneficiário"
                    name="beneficiaryBank"
                    value={formData.beneficiaryBank}
                    onChange={handleChange}
                    error={!!formErrors.beneficiaryBank}
                    helperText={formErrors.beneficiaryBank}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Número da Conta do Beneficiário"
                    name="beneficiaryAccountNumber"
                    value={formData.beneficiaryAccountNumber}
                    onChange={handleChange}
                    error={!!formErrors.beneficiaryAccountNumber}
                    helperText={formErrors.beneficiaryAccountNumber}
                  />
                </Grid>
                
                {formData.transferType === 'international' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Código SWIFT"
                      name="swiftCode"
                      value={formData.swiftCode}
                      onChange={handleChange}
                      error={!!formErrors.swiftCode}
                      helperText={formErrors.swiftCode}
                    />
                  </Grid>
                )}
              </>
            )}
            
            {/* Amount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <PaymentIcon sx={{ mr: 1 }} />,
                }}
              />
              
              {/* Mostrar conversão de moeda se necessário */}
              {isCurrencyConversion && formData.amount && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CurrencyExchangeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Conversão: {isSimulating ? (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    ) : (
                      <>
                        {formatCurrency(formData.amount, userAccounts.find(acc => acc.id === formData.fromAccount)?.currency)} 
                        <SwapIcon sx={{ mx: 1 }} /> 
                        {convertedAmount ? formatCurrency(convertedAmount, userAccounts.find(acc => acc.id === formData.toAccount)?.currency) : '-'}
                      </>
                    )}
                  </Typography>
                  {exchangeRate && (
                    <Typography variant="caption" color="text.secondary">
                      Taxa de câmbio: 1 {userAccounts.find(acc => acc.id === formData.fromAccount)?.currency} = {exchangeRate.toFixed(4)} {userAccounts.find(acc => acc.id === formData.toAccount)?.currency}
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>
            
            {/* Transfer Method */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Transferência</InputLabel>
                <Select
                  name="transferMethod"
                  value={formData.transferMethod}
                  onChange={handleChange}
                >
                  <MenuItem value="standard">Transferência Padrão</MenuItem>
                  <MenuItem value="express">Transferência Expressa</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.transferMethod === 'express' 
                    ? 'Transferências expressas são processadas em até 2 horas (taxas adicionais se aplicam)'
                    : 'Transferências padrão são processadas em até 24 horas'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                InputProps={{
                  startAdornment: <DescriptionIcon sx={{ mr: 1, mt: 1 }} />,
                }}
              />
            </Grid>
            
            {/* Error Display */}
            {transferError && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {transferError}
                </Alert>
              </Grid>
            )}
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={transferLoading}
                loadingPosition="start"
                startIcon={<SendIcon />}
                fullWidth
              >
                {transferLoading ? 'Processando Transferência...' : 'Enviar Transferência'}
              </LoadingButton>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Transfer Information */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações da Transferência
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Saldo Disponível
            </Typography>
            <Typography variant="h6">
              {formatCurrency(availableBalance, userAccounts.find(acc => acc.id === formData.fromAccount)?.currency)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Limites de Transferência
            </Typography>
            <Typography variant="body2">
              Limite Diário: {formatCurrency(50000, userAccounts.find(acc => acc.id === formData.fromAccount)?.currency)}<br />
              Por Transação: {formatCurrency(10000, userAccounts.find(acc => acc.id === formData.fromAccount)?.currency)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Tempo de Processamento
            </Typography>
            <Typography variant="body2">
              Padrão: Até 24 horas<br />
              Expresso: Até 2 horas
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransferFunds;
