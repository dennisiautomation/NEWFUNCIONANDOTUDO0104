const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activity-log.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Todas as rotas requerem autenticação e privilégios de administrador
router.use(verifyToken, isAdmin);

// Rotas para gerenciamento de logs de atividades
router.get(
  '/', 
  userActivityMiddleware('view_activity_logs'), 
  activityLogController.getLogs
);

router.get(
  '/stats', 
  userActivityMiddleware('view_log_statistics'), 
  activityLogController.getLogStats
);

router.post(
  '/cleanup', 
  userActivityMiddleware('cleanup_logs'), 
  activityLogController.cleanupLogs
);

router.get(
  '/export', 
  userActivityMiddleware('export_logs'), 
  activityLogController.exportLogs
);

module.exports = router;
