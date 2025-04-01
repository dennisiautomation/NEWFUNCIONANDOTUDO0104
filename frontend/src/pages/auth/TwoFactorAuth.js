import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Link
} from '@mui/material';
import { verifyTwoFactor } from '../../store/slices/authSlice';

const TwoFactorAuth = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, twoFactorError } = useSelector((state) => state.auth);
  
  // Extrair email do state da rota
  const email = location.state?.email || '';
  
  useEffect(() => {
    // Redirecionar se não há email
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Por favor, insira o código de verificação');
      return;
    }
    
    try {
      // Simular a verificação do código 2FA
      // Na implementação real, você usaria:
      // await dispatch(verifyTwoFactor({ email, code })).unwrap();
      
      // Por enquanto, vamos apenas simular
      if (code === '123456') {
        navigate('/dashboard');
      } else {
        setError('Código de verificação inválido');
      }
    } catch (err) {
      // Erro já tratado pelo Redux
    }
  };
  
  const handleResendCode = () => {
    // Simular reenvio do código
    alert('Um novo código foi enviado para ' + email);
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Verificação em Duas Etapas
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Enviamos um código de verificação para {email}
        </Typography>
        
        {twoFactorError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {twoFactorError}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Código de Verificação"
            variant="outlined"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mb: 3 }}
            autoFocus
            inputProps={{ maxLength: 6 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Verificar'}
          </Button>
        </form>
        
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Link
              component="button"
              variant="body2"
              onClick={handleResendCode}
              underline="hover"
            >
              Reenviar código
            </Link>
          </Grid>
          <Grid item>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              underline="hover"
            >
              Voltar ao login
            </Link>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TwoFactorAuth;
