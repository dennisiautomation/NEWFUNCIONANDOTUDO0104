const express = require('express');
const router = express.Router();

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
          accountNumber: '10001',
          balance: 0.00,
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
          accountNumber: '10002',
          balance: 0.00,
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
          accountNumber: '10003',
          balance: 0.00,
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

// Routes
router.get('/', accountController.getAccounts);
router.get('/my-accounts', (req, res) => {
  // Garantir que sempre retorne as três contas, ignorando a autenticação temporariamente
  // para fins de teste
  console.log('Endpoint /accounts/my-accounts acessado');
  
  res.json({
    status: 'success',
    data: [
      {
        id: 'acc-usd-001',
        userId: 1,
        type: 'CHECKING',
        accountNumber: '10001',
        balance: 0.00,
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
        userId: 1,
        type: 'CHECKING',
        accountNumber: '10002',
        balance: 0.00,
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
        userId: 1,
        type: 'CHECKING',
        accountNumber: '10003',
        balance: 0.00,
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
});
router.get('/:id', accountController.getAccountById);

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
