import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const RootBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
}));

const ContentBox = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 500,
  width: '100%',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const Footer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const AuthLayout = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <RootBox>
      <Header>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
          NewCash Bank
        </Typography>
      </Header>

      <ContentBox>
        <Container maxWidth="sm">
          <AuthPaper elevation={3}>
            <Outlet />
          </AuthPaper>
        </Container>
      </ContentBox>

      <Footer>
        <Typography variant="body2" color="text.secondary">
          © {currentYear} NewCash Bank. All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Secure banking for your future
        </Typography>
      </Footer>
    </RootBox>
  );
};

export default AuthLayout;
