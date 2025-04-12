const express = require('express');
const router = express.Router();
const currencyTransferController = require('../controllers/currency-transfer.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rota para executar transferência entre contas de moedas diferentes
router.post('/execute', currencyTransferController.executeCurrencyTransfer);

// Rota para obter taxa de câmbio entre duas moedas
router.get('/rate/:fromCurrency/:toCurrency', currencyTransferController.getExchangeRate);

// Rota para simular conversão entre moedas
router.post('/simulate', currencyTransferController.simulateConversion);

module.exports = router;
