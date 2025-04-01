import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Typography,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert
} from '@mui/material';
import { executeTransfer } from '../store/slices/transactionSlice';

const TransferForm = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    currency: 'USD',
    country: '',
    transferType: 'SWIFT',
    description: '',
    bankName: '',
    preferredBank: false
  });

  useEffect(() => {
    if (user?.accountNumber) {
      setFormData(prev => ({
        ...prev,
        fromAccount: user.accountNumber
      }));
    }
  }, [user]);

  const [availableBanks] = useState([
    { id: 1, name: 'FT Asset Management', code: 'FTAM' },
    { id: 2, name: 'NewCash Bank', code: 'NCB' },
    { id: 3, name: 'Global Finance', code: 'GF' }
  ]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.accountNumber) {
      console.error('Usuário não está logado ou não tem número de conta');
      return;
    }

    try {
      const transferData = {
        fromAccount: user.accountNumber,
        toAccount: formData.toAccount,
        amount: Number(formData.amount),
        currency: formData.currency,
        // Dados adicionais que podem ser úteis para o backend
        metadata: {
          country: formData.country,
          transferType: formData.transferType,
          bankCode: formData.bankName,
          description: formData.description
        }
      };

      const result = await dispatch(executeTransfer(transferData)).unwrap();
      
      if (result.success) {
        // Limpar formulário ou redirecionar
        setFormData({
          ...formData,
          toAccount: '',
          amount: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('Erro na transferência:', error);
    }
  };

  if (!user?.accountNumber) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">
          Por favor, faça login para realizar transferências.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Nova Transferência
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Conta de Origem: {user.accountNumber}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>País Destino</InputLabel>
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              >
                <MenuItem value="BR">Brasil</MenuItem>
                <MenuItem value="US">Estados Unidos</MenuItem>
                <MenuItem value="EU">Europa</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Transferência</InputLabel>
              <Select
                name="transferType"
                value={formData.transferType}
                onChange={handleChange}
                required
              >
                <MenuItem value="SWIFT">SWIFT</MenuItem>
                <MenuItem value="SEPA">SEPA</MenuItem>
                <MenuItem value="LOCAL">Transferência Local</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Banco</InputLabel>
              <Select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
              >
                {availableBanks.map(bank => (
                  <MenuItem key={bank.id} value={bank.code}>
                    {bank.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <TextField
                name="toAccount"
                label="Conta de Destino"
                value={formData.toAccount}
                onChange={handleChange}
                required
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <TextField
                name="amount"
                label="Valor"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                inputProps={{ step: "0.01" }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Moeda</InputLabel>
              <Select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <TextField
                name="description"
                label="Descrição"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl>
              <FormControlLabel
                control={
                  <Radio
                    checked={formData.preferredBank}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferredBank: e.target.checked
                    })}
                  />
                }
                label="Salvar como banco preferencial"
              />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
            >
              Realizar Transferência
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default TransferForm;
