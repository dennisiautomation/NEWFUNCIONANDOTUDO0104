import React from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { translate } from '../../utils/translations';

const ComingSoon = ({ feature, returnPath = '/admin/dashboard' }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {translate('Coming Soon', language)}
        </Typography>
        
        <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>
          {feature}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {translate('This feature is currently under development and will be available in the next update.', language)}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {translate('We are working hard to implement this functionality with real data from the FT Asset Management API.', language)}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(returnPath)}
          >
            {translate('Return to Dashboard', language)}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ComingSoon;
