const express = require('express');
const router = express.Router();

// Temporary controller for testing
const userController = {
  getUsers: (req, res) => {
    res.json({
      status: 'success',
      data: [
        {
          _id: 'admin-001',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@newcash.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date()
        }
      ]
    });
  },
  getProfile: (req, res) => {
    res.json({
      status: 'success',
      data: {
        id: 'admin-001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@newcash.com',
        role: 'ADMIN',
        createdAt: new Date()
      }
    });
  },
  updateProfile: (req, res) => {
    res.json({
      status: 'success',
      message: 'Perfil atualizado com sucesso',
      data: {
        ...req.body,
        id: 'admin-001',
        updatedAt: new Date()
      }
    });
  }
};

// Routes
router.get('/', userController.getUsers);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Adicionar rota para buscar usuário por email
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    // Importar o modelo User diretamente do sistema
    const { User } = require('../pg-models');
    
    // Buscar usuário pelo email
    const user = await User.findOne({ 
      where: { email },
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'twoFactorSecret'] }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
