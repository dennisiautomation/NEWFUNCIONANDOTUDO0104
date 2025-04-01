const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statement.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Todas as rotas requerem autenticação
router.use(verifyToken);

// Rotas para extratos e relatórios financeiros
router.get(
  '/accounts/:accountId', 
  userActivityMiddleware('view_account_statement'), 
  statementController.getAccountStatement
);

router.get(
  '/accounts/:accountId/pdf', 
  userActivityMiddleware('generate_pdf_statement'), 
  statementController.generatePdfStatement
);

router.get(
  '/summary', 
  userActivityMiddleware('view_financial_summary'), 
  statementController.getFinancialSummary
);

module.exports = router;
