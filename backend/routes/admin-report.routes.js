const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/admin-report.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Todas as rotas requerem autenticação e permissões de administrador
router.use(verifyToken);
router.use(isAdmin);

// Rotas para relatórios administrativos
router.get(
  '/transactions', 
  userActivityMiddleware('view_admin_transactions_report'), 
  adminReportController.getAllTransactions
);

router.get(
  '/accounts', 
  userActivityMiddleware('view_admin_accounts_report'), 
  adminReportController.getAllAccounts
);

router.get(
  '/dashboard', 
  userActivityMiddleware('view_admin_dashboard'), 
  adminReportController.getDashboardStats
);

router.get(
  '/transactions/pdf', 
  userActivityMiddleware('generate_admin_transactions_pdf'), 
  adminReportController.generateTransactionsPdf
);

module.exports = router;
