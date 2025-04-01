const express = require('express');
const router = express.Router();
const internalUserController = require('../controllers/internal-user.controller');
const { verifyToken, isAdmin } = require('../middleware/internal-auth.middleware');
const userActivityMiddleware = require('../middleware/user-activity.middleware');

// Rotas públicas
router.post(
  '/register',
  userActivityMiddleware('register_internal_user'),
  internalUserController.register
);

router.post(
  '/login',
  userActivityMiddleware('login_internal_user'),
  internalUserController.login
);

// Rotas autenticadas
router.get(
  '/profile',
  verifyToken,
  userActivityMiddleware('view_internal_profile'),
  internalUserController.getProfile
);

router.put(
  '/profile',
  verifyToken,
  userActivityMiddleware('update_internal_profile'),
  internalUserController.updateProfile
);

router.post(
  '/change-password',
  verifyToken,
  userActivityMiddleware('change_internal_password'),
  internalUserController.changePassword
);

// Rotas administrativas
router.get(
  '/admin/users',
  verifyToken,
  isAdmin,
  userActivityMiddleware('admin_list_internal_users'),
  async (req, res) => {
    try {
      const { User } = require('../pg-models');
      const users = await User.findAll({
        attributes: { exclude: ['password', 'twoFactorSecret'] },
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        message: 'Lista de usuários obtida com sucesso',
        data: users
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao listar usuários',
        error: error.message
      });
    }
  }
);

module.exports = router;
