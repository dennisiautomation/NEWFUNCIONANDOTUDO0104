const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Controller para preferências de usuário
const userPreferencesController = {
  // Obter preferências do usuário
  getUserPreferences: (req, res) => {
    // Dados de exemplo para preferências de usuário
    const preferences = {
      theme: 'light',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      dashboard: {
        showBalance: true,
        defaultCurrency: 'USD',
        widgets: ['accounts', 'transactions', 'transfers']
      },
      security: {
        requireConfirmation: true,
        twoFactorAuth: false
      }
    };

    res.json(preferences);
  },

  // Atualizar preferências do usuário
  updateUserPreferences: (req, res) => {
    // Em uma implementação real, salvaríamos as preferências no banco de dados
    // Por enquanto, apenas retornar sucesso
    res.json({
      success: true,
      message: 'Preferências atualizadas com sucesso'
    });
  }
};

// Rotas
router.get('/preferences', verifyToken, userPreferencesController.getUserPreferences);
router.put('/preferences', verifyToken, userPreferencesController.updateUserPreferences);

module.exports = router;
