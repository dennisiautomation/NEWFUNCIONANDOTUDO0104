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
  Autocomplete
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  AccountBalance as AccountIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { fetchAccounts } from '../../store/slices/accountSlice';
import { executeTransfer } from '../../store/slices/transactionSlice';

const TransferFunds = () => {
  const dispatch = useDispatch();
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
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
  
  // Fetch accounts on component mount
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);
  
  // Update available balance when from account changes
  useEffect(() => {
    if (formData.fromAccount && accounts) {
      const selectedAccount = accounts.find(acc => acc.id === formData.fromAccount);
      if (selectedAccount) {
        setAvailableBalance(selectedAccount.balance);
      }
    }
  }, [formData.fromAccount, accounts]);
  
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
        // Error handling is managed by the Redux slice
      }
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear related errors when field changes
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Get available accounts for transfer
  const getAvailableToAccounts = () => {
    if (!accounts) return [];
    return accounts.filter(acc => acc.id !== formData.fromAccount);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
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
                  {accounts?.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountName} - {formatCurrency(account.balance)}
                    </MenuItem>
                  ))}
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
                    {getAvailableToAccounts().map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.accountName}
                      </MenuItem>
                    ))}
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
              {formatCurrency(availableBalance)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Limites de Transferência
            </Typography>
            <Typography variant="body2">
              Limite Diário: {formatCurrency(50000)}<br />
              Por Transação: {formatCurrency(10000)}
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
    </Box>
  );
};

export default TransferFunds;
