import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Container, Paper } from '@mui/material';
import TransferForm from '../components/TransferForm';
import { fetchUserAccounts } from '../store/slices/accountSlice';

const TransferPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Carregar contas do usuário ao montar o componente
    dispatch(fetchUserAccounts());
  }, [dispatch]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <TransferForm />
      </Paper>
    </Container>
  );
};

export default TransferPage;
