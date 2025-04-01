const express = require('express');
const router = express.Router();
const internalAccountController = require('../controllers/internal-account.controller');
const internalTransactionController = require('../controllers/internal-transaction.controller');
const { verifyToken, isAdmin } = require('../middleware/internal-auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Rota de teste (sem autenticação) para verificar se está funcionando
router.get(
  '/test',
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'API de contas internas está funcionando',
      timestamp: new Date().toISOString()
    });
  }
);

// Rotas administrativas (requerem autenticação de admin)
router.post(
  '/',
  verifyToken,
  isAdmin,
  userActivityMiddleware('create_internal_account'),
  internalAccountController.createAccount
);

router.get(
  '/',
  verifyToken,
  isAdmin,
  userActivityMiddleware('list_internal_accounts'),
  internalAccountController.listAccounts
);

router.get(
  '/:id',
  verifyToken,
  isAdmin,
  userActivityMiddleware('view_internal_account'),
  internalAccountController.getAccountById
);

router.patch(
  '/:id/status',
  verifyToken,
  isAdmin,
  userActivityMiddleware('update_internal_account_status'),
  internalAccountController.updateAccountStatus
);

router.get(
  '/user/:userId',
  verifyToken,
  isAdmin,
  userActivityMiddleware('list_user_internal_accounts'),
  internalAccountController.getUserAccounts
);

// Rotas para transações administrativas
router.post(
  '/deposit',
  verifyToken,
  isAdmin,
  userActivityMiddleware('deposit_internal_account'),
  internalTransactionController.deposit
);

router.post(
  '/withdraw',
  verifyToken,
  isAdmin,
  userActivityMiddleware('withdraw_internal_account'),
  internalTransactionController.withdraw
);

// Rotas para clientes (requerem autenticação, mas não precisam ser admin)
router.get(
  '/my/accounts',
  verifyToken,
  userActivityMiddleware('view_my_internal_accounts'),
  (req, res) => {
    // Redirecionar para getUserAccounts com o ID do usuário autenticado
    req.params.userId = req.user.id;
    internalAccountController.getUserAccounts(req, res);
  }
);

router.get(
  '/my/transactions/:accountId',
  verifyToken,
  userActivityMiddleware('view_my_internal_account_transactions'),
  (req, res) => {
    // Verificar se a conta pertence ao usuário autenticado antes de exibir as transações
    const accountId = req.params.accountId;
    const userId = req.user.id;
    
    // Esta verificação será feita no controller, que filtra por conta e usuário
    internalTransactionController.getAccountTransactions(req, res);
  }
);

router.post(
  '/transfer',
  verifyToken,
  userActivityMiddleware('transfer_internal_account'),
  internalTransactionController.transfer
);

module.exports = router;
