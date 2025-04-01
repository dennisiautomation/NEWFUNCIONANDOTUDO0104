import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Link, 
  InputAdornment, 
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { isValidEmail } from '../../utils/validation';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, resetEmailSent } = useSelector((state) => state.auth);
  
  // Form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
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
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }
    
    return valid;
  };
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(forgotPassword({ email }));
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your email address to reset your password
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {resetEmailSent ? (
        <Paper sx={{ p: 3, backgroundColor: 'success.light', color: 'success.contrastText', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reset Instructions Sent!
          </Typography>
          <Typography variant="body2">
            We've sent password reset instructions to <strong>{email}</strong>. Please check your email inbox and follow the instructions to reset your password.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined />
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
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" variant="body2">
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
