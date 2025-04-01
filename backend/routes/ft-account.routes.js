const express = require('express');
const router = express.Router();
const ftAccountController = require('../controllers/ft-account.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Rota de teste sem autenticação para depuração
router.get(
  '/test',
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Rota de teste funcionando!',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  }
);

// Rota para verificação direta dos saldos (temporária para diagnóstico)
router.get(
  '/test-usd-balance', 
  async (req, res) => {
    try {
      const ftApiService = require('../services/ftApi.service');
      const reservationsData = await ftApiService.getUsdReservations();
      
      let balance = 0;
      
      // Extrair o saldo da resposta da API
      if (reservationsData && reservationsData['ReservationsOverview 0.9'] && 
          reservationsData['ReservationsOverview 0.9'].Details) {
          
          const details = reservationsData['ReservationsOverview 0.9'].Details;
          balance = details.Amount ? parseFloat(details.Amount) : 0;
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Saldo USD obtido com sucesso',
        data: {
          accountNumber: '60428',
          balance: balance,
          currency: 'USD',
          raw: reservationsData
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Erro ao obter saldo USD: ${error.message}`
      });
    }
  }
);

// Rotas sem autenticação para desenvolvimento
router.get(
  '/usd-debug',
  async (req, res) => {
    try {
      // Usar diretamente o saldo real de 1000000
      res.status(200).json({
        status: 'success',
        message: 'Saldo USD obtido com sucesso (debug)',
        data: {
          accountNumber: '60428',
          externalAccountId: '60428',
          accountType: 'USD',
          balance: 1000000,
          currency: 'USD',
          status: 'active',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Erro ao obter saldo USD: ${error.message}`
      });
    }
  }
);

router.get(
  '/eur-debug',
  async (req, res) => {
    try {
      // Usar diretamente o saldo real de 180000
      res.status(200).json({
        status: 'success',
        message: 'Saldo EUR obtido com sucesso (debug)',
        data: {
          accountNumber: '60429',
          externalAccountId: '60429',
          accountType: 'EUR',
          balance: 180000,
          currency: 'EUR',
          status: 'active',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: `Erro ao obter saldo EUR: ${error.message}`
      });
    }
  }
);

// Todas as rotas abaixo requerem autenticação
router.use(verifyToken);

// Rota para obter dados da conta USD (apenas admin)
router.get(
  '/usd',
  isAdmin,
  userActivityMiddleware('view_ft_usd_account'),
  ftAccountController.getUSDAccount
);

// Rota para obter dados da conta EUR (apenas admin)
router.get(
  '/eur',
  isAdmin,
  userActivityMiddleware('view_ft_eur_account'),
  ftAccountController.getEURAccount
);

// Rota para obter transações da conta USD (apenas admin)
router.get(
  '/usd/transactions',
  isAdmin,
  userActivityMiddleware('view_ft_usd_transactions'),
  ftAccountController.getUSDAccountTransactions
);

// Rota para obter transações da conta EUR (apenas admin)
router.get(
  '/eur/transactions',
  isAdmin,
  userActivityMiddleware('view_ft_eur_transactions'),
  ftAccountController.getEURAccountTransactions
);

// Rota para obter transações reais da conta USD (sem dados simulados)
router.get(
  '/usd/transactions-real',
  isAdmin,
  userActivityMiddleware('view_ft_usd_real_transactions'),
  async (req, res) => {
    try {
      const ftApiService = require('../services/ftApi.service');
      // Obter dados das reservas
      const reservationData = await ftApiService.getUsdReservations();
      
      // Processar os dados brutos para extrair transações formatadas
      const transactions = ftApiService.processTransactionsFromReservations(reservationData, 'USD');
      
      res.status(200).json({
        status: 'success',
        message: 'Transações USD reais obtidas com sucesso',
        data: {
          transactions: transactions || []
        }
      });
    } catch (error) {
      console.error('Erro ao obter transações USD reais:', error);
      res.status(500).json({
        status: 'error',
        message: `Erro ao obter transações USD reais: ${error.message}`
      });
    }
  }
);

// Rota para obter transações reais da conta EUR (sem dados simulados)
router.get(
  '/eur/transactions-real',
  isAdmin,
  userActivityMiddleware('view_ft_eur_real_transactions'),
  async (req, res) => {
    try {
      const ftApiService = require('../services/ftApi.service');
      // Obter dados das reservas
      const reservationData = await ftApiService.getEurReservations();
      
      // Processar os dados brutos para extrair transações formatadas
      const transactions = ftApiService.processTransactionsFromReservations(reservationData, 'EUR');
      
      res.status(200).json({
        status: 'success',
        message: 'Transações EUR reais obtidas com sucesso',
        data: {
          transactions: transactions || []
        }
      });
    } catch (error) {
      console.error('Erro ao obter transações EUR reais:', error);
      res.status(500).json({
        status: 'error',
        message: `Erro ao obter transações EUR reais: ${error.message}`
      });
    }
  }
);

// Rota para obter dados de uma conta específica por número
router.get(
  '/:accountNumber',
  userActivityMiddleware('view_ft_account'),
  ftAccountController.getAccountByNumber
);

// Rota para obter transações de uma conta específica
router.get(
  '/:accountNumber/transactions',
  userActivityMiddleware('view_ft_account_transactions'),
  ftAccountController.getAccountTransactions
);

module.exports = router;
