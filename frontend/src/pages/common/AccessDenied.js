import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSelector } from 'react-redux';

const SecurityIcon = styled(LockIcon)(({ theme }) => ({
  fontSize: 80,
  color: theme.palette.warning.main,
  marginBottom: theme.spacing(2),
}));

const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Determine where to navigate back to
  const goBack = () => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <SecurityIcon />
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Access Denied
        </Typography>
        <Typography variant="h6" gutterBottom>
          You don't have permission to view this page
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are trying to access requires different permissions than those you currently have.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AccessDenied;
