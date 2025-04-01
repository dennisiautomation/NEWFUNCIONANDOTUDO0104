const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const ftApiService = require('../services/ftApi.service');

// Rota para buscar informações da conta USD
router.get('/ft-accounts/usd', async (req, res) => {
    try {
        const reservations = await ftApiService.getUsdReservations();
        let balance = 0;
        
        // Extrai o saldo da resposta da API
        if (reservations && reservations['ReservationsOverview 0.9'] && 
            reservations['ReservationsOverview 0.9'].Details) {
            
            const details = reservations['ReservationsOverview 0.9'].Details;
            balance = details.Amount ? parseFloat(details.Amount) : 0;
        }
        
        res.json({
            status: 'success',
            data: {
                accountNumber: '60428',
                accountType: 'USD',
                externalAccountId: '60428',
                balance: balance,
                status: 'active',
                lastActivity: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar conta USD:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// Rota para buscar informações da conta EUR
router.get('/ft-accounts/eur', async (req, res) => {
    try {
        const reservations = await ftApiService.getEurReservations();
        let balance = 0;
        
        // Extrai o saldo da resposta da API
        if (reservations && reservations['ReservationsOverview 0.9'] && 
            reservations['ReservationsOverview 0.9'].Details) {
            
            const details = reservations['ReservationsOverview 0.9'].Details;
            balance = details.Amount ? parseFloat(details.Amount) : 0;
        }
        
        res.json({
            status: 'success',
            data: {
                accountNumber: '60429',
                accountType: 'EUR',
                externalAccountId: '60429',
                balance: balance,
                status: 'active',
                lastActivity: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao buscar conta EUR:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// Rota para buscar transações da conta USD
router.get('/ft-accounts/usd/transactions', async (req, res) => {
    try {
        const reservations = await ftApiService.getUsdReservations();
        let transactions = [];
        
        // Extrai as transações da resposta da API
        if (reservations && reservations['ReservationsOverview 0.9'] && 
            reservations['ReservationsOverview 0.9'].Details) {
            
            const details = reservations['ReservationsOverview 0.9'].Details;
            // Criar uma transação baseada nos dados da reserva
            transactions.push({
                id: 'res-' + Date.now(),
                type: 'DEPOSIT',
                amount: details.Amount ? parseFloat(details.Amount) : 0,
                date: new Date().toISOString(),
                description: 'FT Asset Management Reservation',
                status: 'completed',
                currency: 'USD'
            });
        }
        
        res.json({
            status: 'success',
            data: transactions
        });
    } catch (error) {
        console.error('Erro ao buscar transações USD:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// Rota para buscar transações da conta EUR
router.get('/ft-accounts/eur/transactions', async (req, res) => {
    try {
        const reservations = await ftApiService.getEurReservations();
        let transactions = [];
        
        // Extrai as transações da resposta da API
        if (reservations && reservations['ReservationsOverview 0.9'] && 
            reservations['ReservationsOverview 0.9'].Details) {
            
            const details = reservations['ReservationsOverview 0.9'].Details;
            // Criar uma transação baseada nos dados da reserva
            transactions.push({
                id: 'res-' + Date.now(),
                type: 'DEPOSIT',
                amount: details.Amount ? parseFloat(details.Amount) : 0,
                date: new Date().toISOString(),
                description: 'FT Asset Management Reservation',
                status: 'completed',
                currency: 'EUR'
            });
        }
        
        res.json({
            status: 'success',
            data: transactions
        });
    } catch (error) {
        console.error('Erro ao buscar transações EUR:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message 
        });
    }
});

// Rota para buscar informações da conta
router.get('/account/:accountId', async (req, res) => {
    try {
        const accountInfo = await ftApiService.getAccountInfo(req.params.accountId);
        res.json(accountInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rota para realizar transferência
router.post('/transfer', async (req, res) => {
    try {
        const result = await ftApiService.initiateTransfer(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rota para buscar histórico de transações
router.get('/transactions/:accountId', async (req, res) => {
    try {
        const transactions = await ftApiService.getTransactionHistory(req.params.accountId);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @route   GET /api/ft/reservations/usd
 * @desc    Obter todas as reservas USD pendentes
 * @access  Admin
 */
router.get('/reservations/usd', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reservations = await ftApiService.getUsdReservations();
    res.json({
      status: 'success',
      data: reservations
    });
  } catch (error) {
    console.error('Erro ao obter reservas USD:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter reservas USD',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ft/reservations/eur
 * @desc    Obter todas as reservas EUR pendentes
 * @access  Admin
 */
router.get('/reservations/eur', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reservations = await ftApiService.getEurReservations();
    res.json({
      status: 'success',
      data: reservations
    });
  } catch (error) {
    console.error('Erro ao obter reservas EUR:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter reservas EUR',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ft/reservations/confirm
 * @desc    Confirmar uma reserva (aceitar ou rejeitar)
 * @access  Admin
 */
router.post('/reservations/confirm', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { refNum, status } = req.body;
    
    if (!refNum || !status) {
      return res.status(400).json({
        status: 'error',
        message: 'RefNum e status são obrigatórios'
      });
    }
    
    const result = await ftApiService.confirmReservation(refNum, status);
    
    res.json({
      status: 'success',
      message: `Reserva ${refNum} ${status === 'accepted' ? 'aceita' : 'rejeitada'} com sucesso`,
      data: result
    });
  } catch (error) {
    console.error('Erro ao confirmar reserva:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao confirmar reserva',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ft/transfers/incoming
 * @desc    Verificar transferências recebidas
 * @access  Admin
 */
router.get('/transfers/incoming', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const transfers = await ftApiService.checkIncomingTransfers();
    res.json({
      status: 'success',
      data: transfers
    });
  } catch (error) {
    console.error('Erro ao verificar transferências recebidas:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar transferências recebidas',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ft/status
 * @desc    Verificar status da integração com FT API
 * @access  Admin
 */
router.get('/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Verificar status básico das APIs
    const baseUrl = ftApiService.baseUrl;
    const usdAccount = ftApiService.usdAccount;
    const eurAccount = ftApiService.eurAccount;
    
    res.json({
      status: 'success',
      data: {
        integrated: true,
        baseUrl,
        usdAccount,
        eurAccount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status da FT API:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status da FT API',
      error: error.message
    });
  }
});

module.exports = router;
