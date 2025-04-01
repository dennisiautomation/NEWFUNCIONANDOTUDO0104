import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Snackbar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Notifications as NotificationsIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateSystemSettings,
  testApiConnections
} from '../../store/slices/settingsSlice';

const SystemSettings = () => {
  const dispatch = useDispatch();
  
  // Dados estáticos em vez de pegar do Redux
  const loading = false;
  const error = null;
  const [testingApi, setTestingApi] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Estados locais
  const [formData, setFormData] = useState({
    security: {
      maxLoginAttempts: 3,
      sessionTimeout: 30,
      requireTwoFactor: true,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordExpiryDays: 90
    },
    transactions: {
      defaultDailyLimit: 50000,
      defaultTransactionLimit: 10000,
      requireApprovalAbove: 100000,
      allowInternational: true,
      internationalFeePercentage: 1.5
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      notifyOnLogin: true,
      notifyOnTransfer: true,
      notifyOnLimitChange: true
    },
    api: {
      baseUrl: 'https://mytest.ftassetmanagement.com/api',
      apiKey: '6d9bac1b-f685-11ef-a3af-00155d010b18',
      timeout: 30000,
      retryAttempts: 3
    }
  });
  
  const [openDialog, setOpenDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Manipular mudanças no formulário
  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  // Salvar configurações
  const handleSave = async () => {
    try {
      await dispatch(updateSystemSettings(formData)).unwrap();
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  // Testar conexão com API
  const handleTestApi = async () => {
    setTestingApi(true);
    try {
      // Simulação de chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulação de resposta
      const apiStatus = {
        status: 'success',
        apis: [
          { name: 'Reservation', status: 'connected', latency: '45ms' },
          { name: 'Confirmation', status: 'connected', latency: '52ms' },
          { name: 'Send', status: 'connected', latency: '38ms' },
          { name: 'Receive', status: 'connected', latency: '41ms' }
        ]
      };
      
      setTestResults(apiStatus);
      setSnackbarMessage('Todas as conexões com APIs foram testadas com sucesso!');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Erro ao testar conexão com API!');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setTestingApi(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configurações do Sistema
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Configurações de Segurança */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">
                Segurança
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tentativas Máximas de Login"
                  type="number"
                  value={formData.security.maxLoginAttempts}
                  onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Timeout da Sessão (minutos)"
                  type="number"
                  value={formData.security.sessionTimeout}
                  onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.security.requireTwoFactor}
                      onChange={(e) => handleChange('security', 'requireTwoFactor', e.target.checked)}
                    />
                  }
                  label="Exigir Autenticação de Dois Fatores"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tamanho Mínimo da Senha"
                  type="number"
                  value={formData.security.passwordMinLength}
                  onChange={(e) => handleChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 6 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiração da Senha (dias)"
                  type="number"
                  value={formData.security.passwordExpiryDays}
                  onChange={(e) => handleChange('security', 'passwordExpiryDays', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.security.passwordRequireSpecial}
                      onChange={(e) => handleChange('security', 'passwordRequireSpecial', e.target.checked)}
                    />
                  }
                  label="Exigir Caracteres Especiais na Senha"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.security.passwordRequireNumbers}
                      onChange={(e) => handleChange('security', 'passwordRequireNumbers', e.target.checked)}
                    />
                  }
                  label="Exigir Números na Senha"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Configurações de Transações */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <ApiIcon color="primary" />
              <Typography variant="h6">
                Transações
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Limite Diário Padrão"
                  type="number"
                  value={formData.transactions.defaultDailyLimit}
                  onChange={(e) => handleChange('transactions', 'defaultDailyLimit', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Limite por Transação Padrão"
                  type="number"
                  value={formData.transactions.defaultTransactionLimit}
                  onChange={(e) => handleChange('transactions', 'defaultTransactionLimit', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requer Aprovação Acima de"
                  type="number"
                  value={formData.transactions.requireApprovalAbove}
                  onChange={(e) => handleChange('transactions', 'requireApprovalAbove', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.transactions.allowInternational}
                      onChange={(e) => handleChange('transactions', 'allowInternational', e.target.checked)}
                    />
                  }
                  label="Permitir Transferências Internacionais"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Taxa de Transferência Internacional (%)"
                  type="number"
                  value={formData.transactions.internationalFeePercentage}
                  onChange={(e) => handleChange('transactions', 'internationalFeePercentage', parseFloat(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, step: 0.1 }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Configurações de Notificações */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6">
                Notificações
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.emailEnabled}
                      onChange={(e) => handleChange('notifications', 'emailEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar Notificações por Email"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.smsEnabled}
                      onChange={(e) => handleChange('notifications', 'smsEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar Notificações por SMS"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.pushEnabled}
                      onChange={(e) => handleChange('notifications', 'pushEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar Notificações Push"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.notifyOnLogin}
                      onChange={(e) => handleChange('notifications', 'notifyOnLogin', e.target.checked)}
                    />
                  }
                  label="Notificar em Novos Logins"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.notifyOnTransfer}
                      onChange={(e) => handleChange('notifications', 'notifyOnTransfer', e.target.checked)}
                    />
                  }
                  label="Notificar em Transferências"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.notifyOnLimitChange}
                      onChange={(e) => handleChange('notifications', 'notifyOnLimitChange', e.target.checked)}
                    />
                  }
                  label="Notificar em Alterações de Limite"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Configurações da API */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <KeyIcon color="primary" />
              <Typography variant="h6">
                Configurações da API
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL Base da API"
                  value={formData.api.baseUrl}
                  onChange={(e) => handleChange('api', 'baseUrl', e.target.value)}
                  helperText="Ex: https://mytest.ftassetmanagement.com/api"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chave da API"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api.apiKey}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Timeout (ms)"
                  type="number"
                  value={formData.api.timeout}
                  onChange={(e) => handleChange('api', 'timeout', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1000 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tentativas de Retry"
                  type="number"
                  value={formData.api.retryAttempts}
                  onChange={(e) => handleChange('api', 'retryAttempts', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <LoadingButton 
                    variant="outlined" 
                    color="primary" 
                    loading={testingApi}
                    onClick={handleTestApi}
                    startIcon={<RefreshIcon />}
                  >
                    Testar Conexão
                  </LoadingButton>
                </Box>
              </Grid>
              
              {/* Resultados do teste de API */}
              {testResults && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Resultados do Teste de Conexão
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {testResults.apis.map((api) => (
                        <Grid item xs={12} sm={6} md={3} key={api.name}>
                          <Paper 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center',
                              bgcolor: api.status === 'connected' ? 'success.light' : 'error.light',
                              color: 'background.paper'
                            }}
                          >
                            <Typography variant="subtitle2">
                              {api.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Status: {api.status}
                            </Typography>
                            <Typography variant="body2">
                              Latência: {api.latency}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Botões de Ação */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
        >
          Recarregar
        </Button>
        
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={loading}
          startIcon={<SaveIcon />}
        >
          Salvar Alterações
        </LoadingButton>
      </Box>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;
