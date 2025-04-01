import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Send as SendIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { initiateTransfer, confirmTransfer } from '../../store/slices/transactionSlice';
import { fetchAccounts } from '../../store/slices/accountSlice';

const Transfer = () => {
  const dispatch = useDispatch();
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { loading: transferLoading, error: transferError } = useSelector((state) => state.transactions);
  
  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    currency: 'USD',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [confirmationData, setConfirmationData] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Buscar contas ao montar o componente
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);
  
  // Passos do processo de transferência
  const steps = [
    'Detalhes da Transferência',
    'Confirmação',
    'Comprovante'
  ];
  
  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fromAccount) {
      errors.fromAccount = 'Selecione a conta de origem';
    }
    
    if (!formData.toAccount) {
      errors.toAccount = 'Informe a conta de destino';
    }
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Valor inválido';
    }
    
    if (formData.fromAccount === formData.toAccount) {
      errors.toAccount = 'A conta de destino deve ser diferente da conta de origem';
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
  
  // Avançar para próximo passo
  const handleNext = async () => {
    if (activeStep === 0 && validateForm()) {
      try {
        const result = await dispatch(initiateTransfer(formData)).unwrap();
        setConfirmationData(result);
        setActiveStep(prev => prev + 1);
      } catch (error) {
        // Erro é tratado pelo Redux
      }
    } else if (activeStep === 1) {
      try {
        await dispatch(confirmTransfer(confirmationData.transferId)).unwrap();
        setActiveStep(prev => prev + 1);
        setShowSuccessDialog(true);
      } catch (error) {
        // Erro é tratado pelo Redux
      }
    }
  };
  
  // Voltar para passo anterior
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // Iniciar nova transferência
  const handleNewTransfer = () => {
    setActiveStep(0);
    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: '',
      currency: 'USD',
      description: ''
    });
    setConfirmationData(null);
    setShowSuccessDialog(false);
  };
  
  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Renderizar formulário de transferência
  const renderTransferForm = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth error={!!formErrors.fromAccount}>
          <InputLabel>Conta de Origem</InputLabel>
          <Select
            name="fromAccount"
            value={formData.fromAccount}
            onChange={handleChange}
            label="Conta de Origem"
          >
            {accounts?.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.accountNumber} - Saldo: {formatCurrency(account.balance, account.currency)}
              </MenuItem>
            ))}
          </Select>
          {formErrors.fromAccount && (
            <Typography variant="caption" color="error">
              {formErrors.fromAccount}
            </Typography>
          )}
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Conta de Destino"
          name="toAccount"
          value={formData.toAccount}
          onChange={handleChange}
          error={!!formErrors.toAccount}
          helperText={formErrors.toAccount}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
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
            startAdornment: (
              <InputAdornment position="start">
                {formData.currency}
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Moeda</InputLabel>
          <Select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            label="Moeda"
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Descrição"
          name="description"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  );
  
  // Renderizar confirmação
  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirme os dados da transferência
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Conta de Origem
                </Typography>
                <Typography variant="body1">
                  {confirmationData?.fromAccountDetails}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Conta de Destino
                </Typography>
                <Typography variant="body1">
                  {confirmationData?.toAccountDetails}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Valor
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(confirmationData?.amount, confirmationData?.currency)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Taxa
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(confirmationData?.fee, confirmationData?.currency)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(
                    parseFloat(confirmationData?.amount) + parseFloat(confirmationData?.fee),
                    confirmationData?.currency
                  )}
                </Typography>
              </Grid>
              
              {confirmationData?.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Descrição
                  </Typography>
                  <Typography variant="body1">
                    {confirmationData.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Renderizar comprovante
  const renderReceipt = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Transferência Realizada com Sucesso
      </Typography>
      
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color="success.main">
                Transferência confirmada
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Identificador da Transferência
            </Typography>
            <Typography variant="body1">
              {confirmationData?.transferId}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Data/Hora
            </Typography>
            <Typography variant="body1">
              {new Date().toLocaleString('pt-BR')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              fullWidth
            >
              Baixar Comprovante
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nova Transferência
      </Typography>
      
      {transferError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {transferError}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {accountsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {activeStep === 0 && renderTransferForm()}
            {activeStep === 1 && renderConfirmation()}
            {activeStep === 2 && renderReceipt()}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              {activeStep > 0 && activeStep < 2 && (
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Voltar
                </Button>
              )}
              
              {activeStep < 2 ? (
                <LoadingButton
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleNext}
                  loading={transferLoading}
                >
                  {activeStep === 1 ? 'Confirmar' : 'Continuar'}
                </LoadingButton>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNewTransfer}
                  startIcon={<SendIcon />}
                >
                  Nova Transferência
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Diálogo de Sucesso */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
      >
        <DialogTitle>
          Transferência Realizada com Sucesso
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Sua transferência foi processada e confirmada.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              O comprovante está disponível para download.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSuccessDialog(false)}
          >
            Fechar
          </Button>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
          >
            Baixar Comprovante
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transfer;
