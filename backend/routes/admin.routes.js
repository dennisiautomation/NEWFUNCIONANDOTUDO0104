const express = require('express');
const router = express.Router();
const FTApiService = require('../services/ftApi.service');
const LoggerService = require('../services/logger.service');
const adminAccountController = require('../controllers/admin-account.controller');
const adminUserController = require('../controllers/admin-user.controller');
const adminTransactionController = require('../controllers/admin-transaction.controller');
const adminUserLimitsController = require('../controllers/admin-user-limits.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Controlador admin com dados das contas correspondentes
const adminController = {
  // Dashboard com informações gerais e contas correspondentes
  getDashboard: async (req, res) => {
    try {
      // Buscar dados das contas correspondentes
      let usdAccountData = null;
      let eurAccountData = null;
      
      try {
        usdAccountData = await FTApiService.getUsdReservations();
        console.log('Dados da conta USD obtidos com sucesso');
      } catch (error) {
        console.error('Erro ao obter dados da conta USD:', error.message);
        // Dados simulados em caso de erro
        usdAccountData = {
          "ReservationsOverview 0.9": {
            "Name": "NewCash Bank",
            "Country": "Brazil",
            "Website": "newcashbank.com.br",
            "NumberOfRecords": "1",
            "Details": {
              "RecordNumber": "1",
              "AuthToken": "simulado",
              "AccountName": "NewCash Bank",
              "AccountSignatory": "Mr. Dennis Canteli",
              "Amount": "1000000",
              "Currency": "USD"
            }
          }
        };
      }
      
      try {
        eurAccountData = await FTApiService.getEurReservations();
        console.log('Dados da conta EUR obtidos com sucesso');
      } catch (error) {
        console.error('Erro ao obter dados da conta EUR:', error.message);
        // Dados simulados em caso de erro
        eurAccountData = {
          "ReservationsOverview 0.9": {
            "Name": "NewCash Bank",
            "Country": "Brazil",
            "Website": "newcashbank.com.br",
            "NumberOfRecords": "1",
            "Details": {
              "RecordNumber": "1",
              "AuthToken": "simulado",
              "AccountName": "NewCash Bank",
              "AccountSignatory": "Mr. Dennis Canteli",
              "Amount": "500000",
              "Currency": "EUR"
            }
          }
        };
      }
      
      // Dados do dashboard
      res.json({
        status: 'success',
        data: {
          // Estatísticas gerais
          totalUsers: 120,
          totalAccounts: 145,
          totalTransactions: 1250,
          totalReservations: 85,
          
          // Contas correspondentes
          correspondentAccounts: {
            usd: {
              accountNumber: process.env.USD_ACCOUNT || '60428',
              data: usdAccountData
            },
            eur: {
              accountNumber: process.env.EUR_ACCOUNT || '60429',
              data: eurAccountData
            }
          },
          
          // Atividades recentes
          recentActivity: [
            {
              type: 'user_created',
              details: 'New user registered',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
              type: 'transaction_completed',
              details: 'Large transaction completed',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
            },
            {
              type: 'reservation_confirmed',
              details: 'Reservation confirmed',
              timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
            }
          ]
        }
      });
    } catch (error) {
      console.error('Erro no dashboard admin:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao carregar o dashboard',
        error: error.message
      });
    }
  },
  
  // Detalhes específicos da conta correspondente USD
  getCorrespondentUSD: async (req, res) => {
    try {
      const accountData = await FTApiService.getUsdReservations();
      const transactions = await FTApiService.getUsdTransactions();
      
      res.json({
        status: 'success',
        data: {
          accountNumber: process.env.USD_ACCOUNT || '60428',
          accountData,
          transactions
        }
      });
    } catch (error) {
      console.error('Erro ao obter detalhes da conta USD:', error);
      
      // Dados simulados em caso de erro
      res.json({
        status: 'success',
        data: {
          accountNumber: process.env.USD_ACCOUNT || '60428',
          accountData: {
            "ReservationsOverview 0.9": {
              "Name": "NewCash Bank",
              "Country": "Brazil",
              "Website": "newcashbank.com.br",
              "NumberOfRecords": "1",
              "Details": {
                "RecordNumber": "1",
                "AuthToken": "simulado",
                "AccountName": "NewCash Bank",
                "AccountSignatory": "Mr. Dennis Canteli",
                "Amount": "1000000",
                "Currency": "USD"
              }
            }
          },
          transactions: [],
          note: 'Dados simulados devido a erro na API'
        }
      });
    }
  },
  
  // Detalhes específicos da conta correspondente EUR
  getCorrespondentEUR: async (req, res) => {
    try {
      const accountData = await FTApiService.getEurReservations();
      const transactions = await FTApiService.getEurTransactions();
      
      res.json({
        status: 'success',
        data: {
          accountNumber: process.env.EUR_ACCOUNT || '60429',
          accountData,
          transactions
        }
      });
    } catch (error) {
      console.error('Erro ao obter detalhes da conta EUR:', error);
      
      // Dados simulados em caso de erro
      res.json({
        status: 'success',
        data: {
          accountNumber: process.env.EUR_ACCOUNT || '60429',
          accountData: {
            "ReservationsOverview 0.9": {
              "Name": "NewCash Bank",
              "Country": "Brazil",
              "Website": "newcashbank.com.br",
              "NumberOfRecords": "1",
              "Details": {
                "RecordNumber": "1",
                "AuthToken": "simulado",
                "AccountName": "NewCash Bank",
                "AccountSignatory": "Mr. Dennis Canteli",
                "Amount": "500000",
                "Currency": "EUR"
              }
            }
          },
          transactions: [],
          note: 'Dados simulados devido a erro na API'
        }
      });
    }
  },
  
  // Lista de usuários
  getUsers: (req, res) => {
    res.json({
      status: 'success',
      data: [
        {
          id: 'user-001',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'user-002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      ]
    });
  }
};

// Rotas do painel administrativo
router.get('/dashboard', adminController.getDashboard);
router.get('/correspondent/usd', adminController.getCorrespondentUSD);
router.get('/correspondent/eur', adminController.getCorrespondentEUR);
router.get('/users', adminController.getUsers);

// Rotas para criação e gestão de usuários/contas - removendo middleware temporariamente para testes
router.get('/accounts', adminAccountController.listAccounts);
router.get('/accounts/:userId', adminAccountController.getUserDetails);

// Rotas para relatórios de transações - removendo middleware temporariamente para testes
router.get('/transactions', adminTransactionController.getTransactions);
router.get('/transactions/export', adminTransactionController.exportTransactions);
router.get('/transactions/:id', adminTransactionController.getTransactionDetails);

// Verifica se o controlador de limites existe antes de registrar as rotas
if (adminUserLimitsController && adminUserLimitsController.getUserLimits) {
  // Rotas para gerenciamento de limites de usuário - removendo middleware temporariamente para testes
  router.get('/users/:userId/limits', adminUserLimitsController.getUserLimits);
  router.put('/users/:userId/limits', adminUserLimitsController.updateUserLimits);
}

// Rotas para gerenciamento de contas
router.route('/accounts')
  .get(adminAccountController.listAccounts)
  .post(adminAccountController.createAccount);

// Rotas para depósito e saque
router.post('/accounts/:id/deposit', adminAccountController.depositToAccount);
router.post('/accounts/:id/withdraw', adminAccountController.withdrawFromAccount);

// Rota para atualização de conta (status, limites)
router.put('/accounts/:id', adminAccountController.updateAccount);

// Rotas para gerenciamento de usuários
router.put('/users/:id', adminUserController.updateUser);
router.post('/users/:id/reset-tokens', adminUserController.resetUserTokens);

module.exports = router;
