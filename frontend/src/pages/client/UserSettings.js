import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { updateNotificationPreferences } from '../../store/slices/notificationSlice';
import { updateUserPreferences } from '../../store/slices/userSlice';
import { changePassword } from '../../store/slices/authSlice';

const UserSettings = () => {
  const dispatch = useDispatch();
  const { preferences: notificationPrefs, loading: notifLoading } = useSelector((state) => state.notifications);
  const { preferences: userPrefs, loading: userLoading } = useSelector((state) => state.user);
  const { loading: authLoading } = useSelector((state) => state.auth);
  
  const [notificationSettings, setNotificationSettings] = useState(notificationPrefs);
  const [userSettings, setUserSettings] = useState(userPrefs);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    setNotificationSettings(notificationPrefs);
    setUserSettings(userPrefs);
  }, [notificationPrefs, userPrefs]);
  
  // Manipular mudanças nas configurações de notificação
  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Manipular mudanças nas configurações de usuário
  const handleUserSettingChange = (event) => {
    const { name, value } = event.target;
    setUserSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manipular mudanças nos campos de senha
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validar e salvar nova senha
  const handleSavePassword = async () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'A senha deve ter no mínimo 8 caracteres';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap();
      
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  // Salvar configurações
  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        dispatch(updateNotificationPreferences(notificationSettings)).unwrap(),
        dispatch(updateUserPreferences(userSettings)).unwrap()
      ]);
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>
      
      <Grid container spacing={3}>
        {/* Notificações */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Notificações
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.email}
                      onChange={handleNotificationChange}
                      name="email"
                    />
                  }
                  label="Receber notificações por e-mail"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.push}
                      onChange={handleNotificationChange}
                      name="push"
                    />
                  }
                  label="Receber notificações push"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.transactions}
                      onChange={handleNotificationChange}
                      name="transactions"
                    />
                  }
                  label="Notificações de transações"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.security}
                      onChange={handleNotificationChange}
                      name="security"
                    />
                  }
                  label="Alertas de segurança"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Segurança */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Segurança
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.twoFactorEnabled}
                      onChange={handleUserSettingChange}
                      name="twoFactorEnabled"
                    />
                  }
                  label="Autenticação de dois fatores"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Alterar Senha
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Preferências */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LanguageIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Preferências
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSettings.darkMode}
                      onChange={handleUserSettingChange}
                      name="darkMode"
                    />
                  }
                  label="Modo escuro"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Fuso horário"
                  name="timezone"
                  value={userSettings.timezone}
                  onChange={handleUserSettingChange}
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/New_York">Nova York (GMT-5)</option>
                  <option value="Europe/London">Londres (GMT)</option>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Botão Salvar */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          loading={notifLoading || userLoading}
        >
          Salvar Configurações
        </LoadingButton>
      </Box>
      
      {/* Diálogo de Alteração de Senha */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Alterar Senha
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Senha Atual"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Nova Senha"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Confirmar Nova Senha"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setShowPasswordDialog(false)}
          >
            Cancelar
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSavePassword}
            loading={authLoading}
          >
            Salvar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSettings;
