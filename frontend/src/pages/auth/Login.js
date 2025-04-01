import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Grid, 
  Link, 
  InputAdornment, 
  IconButton, 
  Alert,
  CircularProgress,
  Divider,
  Container,
  Paper
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { login, clearError } from '../../store/slices/authSlice';
import { isValidEmail } from '../../utils/validation';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user, requireTwoFactor } = useSelector((state) => state.auth);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } else if (requireTwoFactor) {
      navigate('/two-factor');
    }
  }, [isAuthenticated, user, requireTwoFactor, navigate]);
  
  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);
  
  // Form validation
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
    };
    
    // Validate email
    if (!email) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Por favor, insira um endereço de email válido';
      valid = false;
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(login({ email, password }));
    }
  };
  
  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 3, mt: 8 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img src="/assets/images/logo.png" alt="NewCash Bank Logo" style={{ height: '60px' }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Acesse sua conta
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Entrar'}
          </Button>
          
          <Grid container justifyContent="space-between">
            <Grid item>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Esqueceu a senha?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Não tem uma conta? Cadastre-se"}
              </Link>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, mb: 1 }}>
            <Divider>
              <Typography variant="caption" color="text.secondary">
                Serviços Bancários Seguros
              </Typography>
            </Divider>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
