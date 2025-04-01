const express = require('express');
const router = express.Router();
const FTApiService = require('../services/ftApi.service');

// Rota de teste simples
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Rota de teste FT Account funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para obter dados da conta USD sem autenticação
router.get('/usd', async (req, res) => {
  try {
    console.log('Buscando dados da conta USD (sem autenticação)');
    const accountData = await FTApiService.getUSDAccountData();
    
    return res.status(200).json({
      status: 'success',
      data: accountData
    });
  } catch (error) {
    console.error(`Erro ao buscar dados da conta USD: ${error.message}`);
    
    // Fornecer dados simulados em caso de erro
    const mockData = {
      accountNumber: process.env.USD_ACCOUNT || '60428',
      balance: 50000.00,
      currency: 'USD',
      status: 'active',
      lastUpdated: new Date().toISOString()
    };
    
    return res.status(200).json({
      status: 'success',
      data: mockData,
      note: 'Dados simulados devido a erro na API FT'
    });
  }
});

// Rota para obter dados da conta EUR sem autenticação
router.get('/eur', async (req, res) => {
  try {
    console.log('Buscando dados da conta EUR (sem autenticação)');
    const accountData = await FTApiService.getEURAccountData();
    
    return res.status(200).json({
      status: 'success',
      data: accountData
    });
  } catch (error) {
    console.error(`Erro ao buscar dados da conta EUR: ${error.message}`);
    
    // Fornecer dados simulados em caso de erro
    const mockData = {
      accountNumber: process.env.EUR_ACCOUNT || '60429',
      balance: 45000.00,
      currency: 'EUR',
      status: 'active',
      lastUpdated: new Date().toISOString()
    };
    
    return res.status(200).json({
      status: 'success',
      data: mockData,
      note: 'Dados simulados devido a erro na API FT'
    });
  }
});

module.exports = router;
