const db = require('../pg-models');
const User = db.User;

/**
 * Controlador para gerenciamento de limites de usuário pelo administrador
 */
const adminUserLimitsController = {
  /**
   * Obter os limites de um usuário específico
   * @param {*} req Requisição
   * @param {*} res Resposta
   */
  getUserLimits: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Resposta temporária para testes
      return res.status(200).json({
        status: 'success',
        message: 'Limites do usuário recuperados com sucesso',
        data: {
          userId,
          dailyTransferLimit: 5000,
          monthlyTransferLimit: 50000,
          singleTransactionLimit: 2000
        }
      });
    } catch (error) {
      console.error('Erro ao recuperar limites do usuário:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Falha ao recuperar limites do usuário',
        error: error.message
      });
    }
  },
  
  /**
   * Atualizar os limites de um usuário específico
   * @param {*} req Requisição
   * @param {*} res Resposta
   */
  updateUserLimits: async (req, res) => {
    try {
      const { userId } = req.params;
      const { dailyTransferLimit, monthlyTransferLimit, singleTransactionLimit } = req.body;
      
      // Resposta temporária para testes
      return res.status(200).json({
        status: 'success',
        message: 'Limites do usuário atualizados com sucesso',
        data: {
          userId,
          dailyTransferLimit: dailyTransferLimit || 5000,
          monthlyTransferLimit: monthlyTransferLimit || 50000,
          singleTransactionLimit: singleTransactionLimit || 2000
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar limites do usuário:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Falha ao atualizar limites do usuário',
        error: error.message
      });
    }
  }
};

module.exports = adminUserLimitsController;
