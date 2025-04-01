const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Controller para as contas FT
const ftAccountsController = {
  // Obter transações da conta USD
  getUsdTransactions: (req, res) => {
    // Dados de exemplo para transações USD
    const transactions = [
      {
        id: 'tr-001',
        date: new Date('2025-03-15'),
        type: 'DEPOSIT',
        amount: 5000.00,
        status: 'COMPLETED',
        description: 'Depósito inicial',
        reference: 'REF-001'
      },
      {
        id: 'tr-002',
        date: new Date('2025-03-20'),
        type: 'TRANSFER',
        amount: -1200.00,
        status: 'COMPLETED',
        description: 'Transferência para conta EUR',
        reference: 'REF-002'
      },
      {
        id: 'tr-003',
        date: new Date('2025-03-25'),
        type: 'WITHDRAWAL',
        amount: -500.00,
        status: 'COMPLETED',
        description: 'Saque',
        reference: 'REF-003'
      }
    ];

    res.json(transactions);
  },

  // Obter transações da conta EUR
  getEurTransactions: (req, res) => {
    // Dados de exemplo para transações EUR
    const transactions = [
      {
        id: 'tr-004',
        date: new Date('2025-03-18'),
        type: 'DEPOSIT',
        amount: 3000.00,
        status: 'COMPLETED',
        description: 'Depósito inicial',
        reference: 'REF-004'
      },
      {
        id: 'tr-005',
        date: new Date('2025-03-22'),
        type: 'TRANSFER',
        amount: -800.00,
        status: 'COMPLETED',
        description: 'Transferência para conta USD',
        reference: 'REF-005'
      },
      {
        id: 'tr-006',
        date: new Date('2025-03-28'),
        type: 'DEPOSIT',
        amount: 1200.00,
        status: 'COMPLETED',
        description: 'Depósito adicional',
        reference: 'REF-006'
      }
    ];

    res.json(transactions);
  },

  // Obter detalhes da conta USD
  getUsdAccount: (req, res) => {
    const account = {
      id: 'acc-001',
      accountNumber: '60428',
      currency: 'USD',
      balance: 5000.00,
      availableBalance: 4800.00,
      status: 'active',
      lastUpdated: new Date()
    };

    res.json(account);
  },

  // Obter detalhes da conta EUR
  getEurAccount: (req, res) => {
    const account = {
      id: 'acc-002',
      accountNumber: '60429',
      currency: 'EUR',
      balance: 15000.00,
      availableBalance: 14500.00,
      status: 'active',
      lastUpdated: new Date()
    };

    res.json(account);
  }
};

// Rotas
router.get('/usd/transactions', verifyToken, ftAccountsController.getUsdTransactions);
router.get('/eur/transactions', verifyToken, ftAccountsController.getEurTransactions);
router.get('/usd', verifyToken, ftAccountsController.getUsdAccount);
router.get('/eur', verifyToken, ftAccountsController.getEurAccount);

module.exports = router;
