const { User, sequelize } = require('../pg-models');
const bcrypt = require('bcryptjs');
const LoggerService = require('../services/logger.service');

/**
 * Controlador para gerenciamento de usuários pelo administrador
 */
class AdminUserController {
  /**
   * Atualizar um usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async updateUser(req, res) {
    const { id } = req.params;
    const { 
      name, 
      email, 
      documentType, 
      documentNumber, 
      password, 
      status, 
      isAdmin, 
      requireTwoFactor, 
      restrictTransactions 
    } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID do usuário é obrigatório'
      });
    }

    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Preparar dados para atualização
      const updateData = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (documentType) updateData.documentType = documentType;
      if (documentNumber) updateData.documentNumber = documentNumber;
      if (status) updateData.status = status;
      
      // Campos booleanos
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (requireTwoFactor !== undefined) updateData.requireTwoFactor = requireTwoFactor;
      if (restrictTransactions !== undefined) updateData.restrictTransactions = restrictTransactions;
      
      // Senha (hash apenas se fornecida)
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      
      // Atualizar o usuário
      await user.update(updateData);
      
      // Remover senha do objeto de retorno
      const userData = user.toJSON();
      delete userData.password;
      
      return res.status(200).json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: userData
      });
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao atualizar usuário'
      });
    }
  }

  /**
   * Resetar tokens de acesso de um usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async resetUserTokens(req, res) {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID do usuário é obrigatório'
      });
    }

    try {
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Atualizar campo para invalidar tokens existentes
      // (normalmente seria um campo como tokenVersion ou lastLogout)
      await user.update({
        tokenVersion: sequelize.literal('COALESCE(tokenVersion, 0) + 1')
      });
      
      // Log da ação administrativa
      LoggerService.info(`Tokens revogados para usuário ID ${id} por administrador`);
      
      return res.status(200).json({
        status: 'success',
        message: 'Todas as sessões do usuário foram revogadas com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao resetar tokens:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao resetar tokens de acesso'
      });
    }
  }
}

module.exports = new AdminUserController();
