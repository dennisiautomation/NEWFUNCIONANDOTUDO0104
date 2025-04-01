import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Link, 
  InputAdornment, 
  IconButton, 
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { resetPassword, clearError } from '../../store/slices/authSlice';
import { isValidPassword } from '../../utils/validation';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL parameter
  const { loading, error, passwordResetSuccess } = useSelector((state) => state.auth);
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
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
      password: '',
      confirmPassword: ''
    };
    
    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character';
      valid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(resetPassword({ token, password }));
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Reset Your Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new password for your account
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {passwordResetSuccess ? (
        <Paper sx={{ p: 3, backgroundColor: 'success.light', color: 'success.contrastText', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Password Reset Successful!
          </Typography>
          <Typography variant="body2">
            Your password has been successfully reset. You can now login with your new password.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoFocus
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
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
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
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ mt: 2, backgroundColor: 'background.paper', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your password must include:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • At least 8 characters<br />
              • At least one uppercase letter (A-Z)<br />
              • At least one lowercase letter (a-z)<br />
              • At least one number (0-9)<br />
              • At least one special character (!@#$%^&*)
            </Typography>
          </Box>
          
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

export default ResetPassword;
