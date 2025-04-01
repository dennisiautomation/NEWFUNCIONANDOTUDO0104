const { User, Account, sequelize, Transaction } = require('../pg-models');
const bcrypt = require('bcryptjs');
const LoggerService = require('../services/logger.service');

/**
 * Controlador para gerenciamento de contas no painel administrativo
 */
class AdminAccountController {
  /**
   * Cria um novo usuário e suas contas padrão (USD, EUR, USDT)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async createAccount(req, res) {
    const t = await sequelize.transaction();
    
    try {
      const { 
        name, 
        email, 
        password, 
        documentType, 
        documentNumber 
      } = req.body;

      if (!name || !email || !password || !documentType || !documentNumber) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Todos os campos são obrigatórios: nome, email, senha, tipo de documento e número do documento'
        });
      }

      // Verificar se o email já está em uso
      const existingUser = await User.findOne({ 
        where: { email },
        transaction: t
      });
      
      if (existingUser) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Este email já está em uso'
        });
      }
      
      // Verificar se o documento já está em uso
      const existingDocument = await User.findOne({ 
        where: { documentNumber },
        transaction: t
      });
      
      if (existingDocument) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Este documento já está cadastrado'
        });
      }

      // Criar o usuário
      const user = await User.create({
        name,
        email,
        password, // A senha será hash automaticamente pelo hook do model
        documentType,
        documentNumber,
        role: 'client',
        status: 'active',
        twoFactorEnabled: false,
        failedLoginAttempts: 0
      }, { transaction: t });

      // Gerar números de conta
      const usdAccountNumber = await Account.generateAccountNumber('internal');
      const eurAccountNumber = await Account.generateAccountNumber('internal');
      const usdtAccountNumber = await Account.generateAccountNumber('internal');

      // Criar conta USD
      const usdAccount = await Account.create({
        accountType: 'internal',
        currency: 'USD',
        userId: user.id,
        name: `Conta USD de ${name}`,
        balance: 0,
        isInternal: true,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber: usdAccountNumber
      }, { transaction: t });

      // Criar conta EUR
      const eurAccount = await Account.create({
        accountType: 'internal',
        currency: 'EUR',
        userId: user.id,
        name: `Conta EUR de ${name}`,
        balance: 0,
        isInternal: true,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber: eurAccountNumber
      }, { transaction: t });

      // Criar conta USDT
      const usdtAccount = await Account.create({
        accountType: 'internal',
        currency: 'USDT',
        userId: user.id,
        name: `Conta USDT de ${name}`,
        balance: 0,
        isInternal: true,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber: usdtAccountNumber
      }, { transaction: t });

      await t.commit();

      // Registrar atividade
      try {
        if (req.user && req.user.id) {
          LoggerService.logUserActivity({
            userId: req.user.id,
            action: 'CREATE_ACCOUNT',
            details: `Administrador criou usuário ${email} com 3 contas (USD, EUR, USDT)`,
            ipAddress: req.ip
          });
        } else {
          console.log('Registro de atividade ignorado: req.user não definido (middleware de autenticação possivelmente desativado para testes)');
        }
      } catch (logError) {
        console.error('Erro ao registrar atividade:', logError);
        // Não interromper o fluxo se houver erro no log
      }

      return res.status(201).json({
        status: 'success',
        message: 'Usuário e contas criados com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            documentType: user.documentType,
            documentNumber: user.documentNumber
          },
          accounts: [
            {
              id: usdAccount.id,
              accountNumber: usdAccount.accountNumber,
              currency: 'USD',
              name: usdAccount.name
            },
            {
              id: eurAccount.id,
              accountNumber: eurAccount.accountNumber,
              currency: 'EUR',
              name: eurAccount.name
            },
            {
              id: usdtAccount.id,
              accountNumber: usdtAccount.accountNumber,
              currency: 'USDT',
              name: usdtAccount.name
            }
          ]
        }
      });
    } catch (error) {
      await t.rollback();
      console.error('Erro ao criar conta:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar usuário e contas',
        error: error.message
      });
    }
  }

  /**
   * Lista todos os usuários com suas contas
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async listAccounts(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = {};
      
      // Implementar busca se houver um termo de pesquisa
      if (search) {
        whereClause = {
          [sequelize.Op.or]: [
            { name: { [sequelize.Op.iLike]: `%${search}%` } },
            { email: { [sequelize.Op.iLike]: `%${search}%` } },
            { documentNumber: { [sequelize.Op.iLike]: `%${search}%` } }
          ]
        };
      }
      
      const users = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Account,
            as: 'accounts',
            where: { isInternal: true },
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });
      
      // Formatar os dados para o formato esperado pelo frontend
      const formattedUsers = users.rows.map(user => {
        const plainUser = user.get({ plain: true });
        
        return {
          id: plainUser.id,
          userId: plainUser.id,
          userName: plainUser.name,
          userEmail: plainUser.email,
          documentType: plainUser.documentType,
          documentNumber: plainUser.documentNumber,
          status: plainUser.status,
          accounts: plainUser.accounts.map(account => ({
            id: account.id,
            accountNumber: account.accountNumber,
            type: account.accountType,
            currency: account.currency,
            balance: account.balance,
            status: account.status,
            createdAt: account.createdAt
          }))
        };
      });
      
      return res.status(200).json({
        status: 'success',
        data: formattedUsers
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao listar usuários',
        error: error.message
      });
    }
  }

  /**
   * Obtém os detalhes de um usuário específico
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Account,
            as: 'accounts',
            where: { isInternal: true },
            required: false
          }
        ]
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Detalhes do usuário recuperados com sucesso',
        data: user
      });
    } catch (error) {
      console.error('Erro ao obter detalhes do usuário:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao obter detalhes do usuário',
        error: error.message
      });
    }
  }

  /**
   * Alterar saldo de uma conta (depósito)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async depositToAccount(req, res) {
    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta é obrigatório'
      });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor deve ser um número positivo'
      });
    }

    try {
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Registrar a transação
      const transaction = await sequelize.transaction();

      try {
        // Atualizar o saldo
        const currentBalance = parseFloat(account.balance || 0);
        const newBalance = currentBalance + parseFloat(amount);
        
        await account.update({ balance: newBalance }, { transaction });
        
        // Criar registro de transação
        await Transaction.create({
          accountId: id,
          type: 'deposit',
          amount: parseFloat(amount),
          description: 'Depósito administrativo',
          status: 'completed',
          createdBy: req.user?.id || 'admin'
        }, { transaction });
        
        await transaction.commit();
        
        return res.status(200).json({
          status: 'success',
          message: 'Depósito realizado com sucesso',
          data: {
            accountId: id,
            newBalance
          }
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      
    } catch (error) {
      console.error('Erro ao processar depósito:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar depósito'
      });
    }
  }

  /**
   * Alterar saldo de uma conta (saque)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async withdrawFromAccount(req, res) {
    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta é obrigatório'
      });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor deve ser um número positivo'
      });
    }

    try {
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      const currentBalance = parseFloat(account.balance || 0);
      
      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente para realizar o saque'
        });
      }

      // Registrar a transação
      const transaction = await sequelize.transaction();

      try {
        // Atualizar o saldo
        const newBalance = currentBalance - parseFloat(amount);
        
        await account.update({ balance: newBalance }, { transaction });
        
        // Criar registro de transação
        await Transaction.create({
          accountId: id,
          type: 'withdraw',
          amount: parseFloat(amount),
          description: 'Saque administrativo',
          status: 'completed',
          createdBy: req.user?.id || 'admin'
        }, { transaction });
        
        await transaction.commit();
        
        return res.status(200).json({
          status: 'success',
          message: 'Saque realizado com sucesso',
          data: {
            accountId: id,
            newBalance
          }
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar saque'
      });
    }
  }

  /**
   * Atualizar uma conta (status, limites)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async updateAccount(req, res) {
    const { id } = req.params;
    const { status, dailyLimit, monthlyLimit } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta é obrigatório'
      });
    }

    try {
      const account = await Account.findByPk(id);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Preparar dados para atualização
      const updateData = {};
      
      if (status) {
        updateData.status = status;
      }
      
      if (dailyLimit !== undefined && dailyLimit !== null) {
        updateData.dailyLimit = parseFloat(dailyLimit);
      }
      
      if (monthlyLimit !== undefined && monthlyLimit !== null) {
        updateData.monthlyLimit = parseFloat(monthlyLimit);
      }
      
      // Atualizar a conta
      await account.update(updateData);
      
      return res.status(200).json({
        status: 'success',
        message: 'Conta atualizada com sucesso',
        data: account
      });
      
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao atualizar conta'
      });
    }
  }
}

module.exports = new AdminAccountController();
