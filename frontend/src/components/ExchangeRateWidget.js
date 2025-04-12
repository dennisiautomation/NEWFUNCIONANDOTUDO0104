import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';

// Componente para exibir taxas de câmbio
const ExchangeRateWidget = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  
  // Obter taxas de câmbio
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/exchange-rates/${baseCurrency}`);
        if (response.data && response.data.status === 'success') {
          setRates(response.data.data);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (err) {
        console.error('Erro ao obter taxas de câmbio:', err);
        setError('Não foi possível obter as taxas de câmbio. Tente novamente mais tarde.');
        
        // Usar taxas de câmbio padrão em caso de erro
        setRates(getDefaultRates(baseCurrency));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRates();
  }, [baseCurrency]);
  
  // Taxas de câmbio padrão em caso de erro
  const getDefaultRates = (base) => {
    const defaultRates = {
      USD: {
        EUR: 0.92,
        BRL: 5.05,
        USDT: 1.0
      },
      EUR: {
        USD: 1.09,
        BRL: 5.50,
        USDT: 1.09
      },
      BRL: {
        USD: 0.198,
        EUR: 0.182,
        USDT: 0.198
      },
      USDT: {
        USD: 1.0,
        EUR: 0.92,
        BRL: 5.05
      }
    };
    
    return defaultRates[base] || defaultRates.USD;
  };
  
  // Manipular mudança de moeda base
  const handleCurrencyChange = (event) => {
    setBaseCurrency(event.target.value);
  };
  
  // Obter símbolo da moeda
  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      BRL: 'R$',
      USDT: '₮'
    };
    
    return symbols[currency] || currency;
  };
  
  // Formatar valor com símbolo da moeda
  const formatCurrency = (value, currency) => {
    return `${getCurrencySymbol(currency)} ${value.toFixed(2)}`;
  };
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Taxas de Câmbio
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="base-currency-label">Moeda Base</InputLabel>
            <Select
              labelId="base-currency-label"
              id="base-currency-select"
              value={baseCurrency}
              label="Moeda Base"
              onChange={handleCurrencyChange}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="BRL">BRL</MenuItem>
              <MenuItem value="USDT">USDT</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2">{error}</Typography>
        ) : (
          <Grid container spacing={2}>
            {rates && Object.entries(rates)
              .filter(([currency]) => currency !== baseCurrency)
              .map(([currency, rate]) => (
                <Grid item xs={12} sm={4} key={currency}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        {baseCurrency} → {currency}
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(1, baseCurrency)} = {formatCurrency(rate, currency)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            }
          </Grid>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          * Taxas atualizadas a cada hora. Última atualização: {rates ? new Date().toLocaleString() : '-'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateWidget;
