import React from 'react';
import { Box, Button, Container, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import ConstructionIcon from '@mui/icons-material/Construction';
import RefreshIcon from '@mui/icons-material/Refresh';

const MaintenanceIcon = styled(ConstructionIcon)(({ theme }) => ({
  fontSize: 80,
  color: theme.palette.warning.main,
  marginBottom: theme.spacing(2),
}));

const Maintenance = () => {
  const handleRefresh = () => {
    window.location.reload();
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
        <MaintenanceIcon />
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          System Maintenance
        </Typography>
        <Typography variant="h6" gutterBottom>
          We're currently performing scheduled maintenance
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The NewCash Banking system is temporarily unavailable while we make improvements to enhance your banking experience.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Please check back shortly. We apologize for any inconvenience.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 4 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Estimated completion time: 30 minutes
          </Typography>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Maintenance;
