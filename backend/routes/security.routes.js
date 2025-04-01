const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const dotenv = require('dotenv');

// Determinar qual controlador usar baseado no modo de operação
let SecurityController;

try {
  // Tentar carregar o controlador normal que usa MongoDB
  SecurityController = require('../controllers/security.controller');
  console.log('Modo de segurança: Normal (com MongoDB)');
} catch (error) {
  // Se falhar, usar o controlador mock
  SecurityController = require('../controllers/security.mock.controller');
  console.log('Modo de segurança: Mock (sem MongoDB)');
}

// Rota para administradores verem todos os logs de segurança
router.get('/', verifyToken, verifyAdmin, SecurityController.getLogs);

// Rota para usuário ver seus próprios logs de segurança
router.get('/user', verifyToken, SecurityController.getUserLogs);

// Rota para administrador ver logs de um usuário específico
router.get('/user/:userId', verifyToken, verifyAdmin, SecurityController.getUserLogs);

module.exports = router;
