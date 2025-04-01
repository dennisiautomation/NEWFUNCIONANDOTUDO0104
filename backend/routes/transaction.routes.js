const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Temporary controller for testing
const transactionController = {
  getTransactions: (req, res) => {
    // Mock data para transações
    const transactions = [
      {
        _id: 'trans-001',
        type: 'DEPOSIT',
        amount: 1500.00,
        description: 'Depósito inicial',
        status: 'COMPLETED',
        accountId: {
          _id: 'acc-001',
          accountNumber: '60428'
        },
        userId: {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User'
        },
        currency: 'USD',
        createdAt: new Date()
      },
      {
        _id: 'trans-002',
        type: 'TRANSFER',
        amount: -500.00,
        description: 'Transferência internacional',
        status: 'COMPLETED',
        accountId: {
          _id: 'acc-001',
          accountNumber: '60428'
        },
        userId: {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User'
        },
        currency: 'USD',
        createdAt: new Date(Date.now() - 86400000) // 1 dia atrás
      },
      {
        _id: 'trans-003',
        type: 'PAYMENT',
        amount: -120.50,
        description: 'Pagamento de serviço',
        status: 'COMPLETED',
        accountId: {
          _id: 'acc-002',
          accountNumber: '60429'
        },
        userId: {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User'
        },
        currency: 'EUR',
        createdAt: new Date(Date.now() - 172800000) // 2 dias atrás
      },
      {
        _id: 'trans-004',
        type: 'RESERVATION',
        amount: 2000.00,
        description: 'Reserva de fundos',
        status: 'PENDING',
        accountId: {
          _id: 'acc-001',
          accountNumber: '60428'
        },
        userId: {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User'
        },
        currency: 'USD',
        createdAt: new Date(Date.now() - 43200000) // 12 horas atrás
      }
    ];

    // Aplicar filtros se fornecidos na query
    let filteredTransactions = [...transactions];
    
    if (req.query.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === req.query.type);
    }
    
    if (req.query.status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === req.query.status);
    }
    
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.createdAt) >= startDate);
    }
    
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.createdAt) <= endDate);
    }

    res.json({
      status: 'success',
      data: filteredTransactions,
      pagination: {
        total: filteredTransactions.length,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        totalPages: Math.ceil(filteredTransactions.length / (parseInt(req.query.limit) || 10))
      }
    });
  },
  
  getAccountTransactions: (req, res) => {
    const accountId = req.params.accountId;
    
    // Mock data para transações de uma conta específica
    const transactions = [
      {
        _id: 'trans-001',
        type: 'DEPOSIT',
        amount: 1500.00,
        description: 'Depósito inicial',
        status: 'COMPLETED',
        accountId: accountId,
        accountNumber: accountId === 'acc-001' ? '60428' : '60429',
        userId: 'admin-001',
        userName: 'Admin User',
        currency: accountId === 'acc-001' ? 'USD' : 'EUR',
        createdAt: new Date()
      },
      {
        _id: 'trans-002',
        type: 'TRANSFER',
        amount: -500.00,
        description: 'Transferência para serviço',
        status: 'COMPLETED',
        accountId: accountId,
        accountNumber: accountId === 'acc-001' ? '60428' : '60429',
        userId: 'admin-001',
        userName: 'Admin User',
        currency: accountId === 'acc-001' ? 'USD' : 'EUR',
        createdAt: new Date(Date.now() - 86400000) // 1 dia atrás
      }
    ];

    res.json({
      status: 'success',
      data: transactions
    });
  },
  
  getUserTransactions: (req, res) => {
    // Mock data para transações do usuário
    const transactions = [
      {
        _id: 'trans-001',
        type: 'deposit',
        amount: 1500.00,
        description: 'Depósito inicial',
        status: 'completed',
        account: {
          _id: 'acc-001',
          accountNumber: '60428',
          currency: 'USD'
        },
        createdAt: new Date()
      },
      {
        _id: 'trans-002',
        type: 'transfer',
        amount: -500.00,
        description: 'Transferência internacional',
        status: 'completed',
        account: {
          _id: 'acc-001',
          accountNumber: '60428',
          currency: 'USD'
        },
        createdAt: new Date(Date.now() - 86400000) // 1 dia atrás
      },
      {
        _id: 'trans-003',
        type: 'payment',
        amount: -120.50,
        description: 'Pagamento de serviço',
        status: 'completed',
        account: {
          _id: 'acc-002',
          accountNumber: '60429',
          currency: 'EUR'
        },
        createdAt: new Date(Date.now() - 172800000) // 2 dias atrás
      },
      {
        _id: 'trans-004',
        type: 'reservation',
        amount: 2000.00,
        description: 'Reserva de fundos',
        status: 'pending',
        account: {
          _id: 'acc-001',
          accountNumber: '60428',
          currency: 'USD'
        },
        createdAt: new Date(Date.now() - 43200000) // 12 horas atrás
      }
    ];

    let limit = parseInt(req.query.limit) || 10;
    
    res.json({
      status: 'success',
      data: transactions.slice(0, limit)
    });
  },
  
  getTransactionDetails: (req, res) => {
    const transactionId = req.params.id;
    
    res.json({
      status: 'success',
      data: {
        _id: transactionId,
        type: 'TRANSFER',
        amount: 1000.00,
        description: 'Transferência internacional',
        status: 'COMPLETED',
        accountId: {
          _id: 'acc-001',
          accountNumber: '60428'
        },
        userId: {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User'
        },
        currency: 'USD',
        recipientAccount: 'DE89370400440532013000',
        recipientName: 'Business Partner',
        recipientBank: 'International Bank',
        reference: 'INV-2025-001',
        fees: 25.00,
        exchangeRate: 1.0,
        createdAt: new Date(),
        completedAt: new Date()
      }
    });
  },
  
  createTransaction: (req, res) => {
    res.json({
      status: 'success',
      message: 'Transação iniciada com sucesso',
      data: {
        _id: 'trans-new',
        ...req.body,
        status: 'PENDING',
        createdAt: new Date()
      }
    });
  }
};

// Routes
router.get('/', verifyToken, userActivityMiddleware('view_transactions'), transactionController.getTransactions);
router.get('/account/:accountId', verifyToken, userActivityMiddleware('view_account_transactions'), transactionController.getAccountTransactions);
router.get('/user', verifyToken, userActivityMiddleware('view_user_transactions'), transactionController.getUserTransactions);
router.get('/:id', verifyToken, userActivityMiddleware('view_transaction_details'), transactionController.getTransactionDetails);
router.post('/', verifyToken, userActivityMiddleware('create_transaction'), transactionController.createTransaction);

module.exports = router;
