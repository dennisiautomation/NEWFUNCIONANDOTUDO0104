const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

// Temporary controller for testing
const accountController = {
  getAccounts: (req, res) => {
    res.json({
      status: 'success',
      data: [
        {
          id: 'acc-usd-001',
          type: 'USD',
          accountNumber: '60428',
          balance: 10000.00,
          currency: 'USD',
          status: 'active',
          createdAt: new Date()
        },
        {
          id: 'acc-eur-001',
          type: 'EUR',
          accountNumber: '60429',
          balance: 8500.00,
          currency: 'EUR',
          status: 'active',
          createdAt: new Date()
        }
      ]
    });
  },
  getAccountById: (req, res) => {
    const accountId = req.params.id;
    res.json({
      status: 'success',
      data: {
        id: accountId,
        type: accountId.includes('usd') ? 'USD' : 'EUR',
        accountNumber: accountId.includes('usd') ? '60428' : '60429',
        balance: accountId.includes('usd') ? 10000.00 : 8500.00,
        currency: accountId.includes('usd') ? 'USD' : 'EUR',
        status: 'active',
        createdAt: new Date()
      }
    });
  },
  getMyAccounts: (req, res) => {
    // Dados das contas do cliente com USD, EUR e USDT
    res.json({
      status: 'success',
      data: [
        {
          id: 'acc-usd-001',
          userId: req.user ? req.user.id : 1,
          type: 'CHECKING',
          accountNumber: '60428',
          balance: 10000.00,
          currency: 'USD',
          dailyTransferLimit: 10000.00,
          dailyTransferTotal: 0,
          monthlyTransferLimit: 50000.00,
          monthlyTransferTotal: 0,
          status: 'active',
          name: 'Conta Dólar',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'acc-eur-001',
          userId: req.user ? req.user.id : 1,
          type: 'CHECKING',
          accountNumber: '60429',
          balance: 8500.00,
          currency: 'EUR',
          dailyTransferLimit: 8000.00,
          dailyTransferTotal: 0,
          monthlyTransferLimit: 40000.00,
          monthlyTransferTotal: 0,
          status: 'active',
          name: 'Conta Euro',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'acc-usdt-001',
          userId: req.user ? req.user.id : 1,
          type: 'CHECKING',
          accountNumber: '60430',
          balance: 5000.00,
          currency: 'USDT',
          dailyTransferLimit: 15000.00,
          dailyTransferTotal: 0,
          monthlyTransferLimit: 75000.00,
          monthlyTransferTotal: 0,
          status: 'active',
          name: 'Conta USDT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
  }
};

const BRLAccountController = require('../controllers/brl-account.controller');

// Routes
router.get('/', accountController.getAccounts);
router.get('/my-accounts', verifyToken, async (req, res) => {
  try {
    // Importar modelo de conta
    const { Account } = require('../pg-models');
    
    // Obter o ID do usuário da requisição
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado'
      });
    }
    
    console.log('Buscando contas para o usuário ID:', userId);
    
    // Buscar as contas do usuário no banco de dados
    const userAccounts = await Account.findAll({
      where: { userId },
      order: [['accountNumber', 'ASC']]
    });
    
    console.log('Contas encontradas:', userAccounts.length);
    
    // Retornar as contas encontradas
    res.json({
      status: 'success',
      data: userAccounts
    });
  } catch (error) {
    console.error('Erro ao buscar contas do usuário:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar contas do usuário',
      error: error.message
    });
  }
});
router.get('/:id', accountController.getAccountById);

// Rotas para contas BRL
router.get('/brl/account', verifyToken, BRLAccountController.getBRLAccount.bind(BRLAccountController));
router.get('/brl/transactions', verifyToken, BRLAccountController.getBRLTransactions.bind(BRLAccountController));
router.post('/brl/create', verifyToken, BRLAccountController.createBRLAccount.bind(BRLAccountController));

// Rota para criar nova conta
router.post('/', async (req, res) => {
  try {
    console.log('Tentativa de criar conta via API:', req.body);
    
    // Importar modelo de conta
    const { Account } = require('../pg-models');
    
    // Garantir que a conta tenha todos os campos corretos
    let accountData = {
      ...req.body,
      status: 'active'  // Forçar status como ativo
    };
    
    // Se não tiver número de conta, gerar um
    if (!accountData.accountNumber) {
      const accountType = accountData.accountType || 'internal';
      accountData.accountNumber = await Account.generateAccountNumber(accountType);
      console.log('Número de conta gerado:', accountData.accountNumber);
    }
    
    // Criar a conta no banco de dados
    const newAccount = await Account.create(accountData);
    console.log('Conta criada com sucesso:', newAccount.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Conta criada com sucesso',
      data: newAccount
    });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao criar conta',
      error: error.message
    });
  }
});

module.exports = router;
