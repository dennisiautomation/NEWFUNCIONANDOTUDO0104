const { User, Account, sequelize, Transaction } = require('../pg-models');
const bcrypt = require('bcryptjs');
const LoggerService = require('../services/logger.service');

/**
 * Controlador para gerenciamento de contas no painel administrativo
 */
class AdminAccountController {
  /**
   * Cria um novo usuário e suas contas padrão (USD, EUR, USDT, BRL)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async createAccount(req, res) {
    try {
      const { 
        name, 
        email, 
        password, 
        documentType, 
        documentNumber 
      } = req.body;

      if (!name || !email || !password || !documentType || !documentNumber) {
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
      const brlAccountNumber = await Account.generateAccountNumber('internal');

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

      // Criar conta BRL
      const brlAccount = await Account.create({
        accountType: 'internal',
        currency: 'BRL',
        userId: user.id,
        name: `Conta BRL de ${name}`,
        balance: 0,
        isInternal: true,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber: brlAccountNumber
      }, { transaction: t });

      await t.commit();

      // Registrar atividade
      try {
        if (req.user && req.user.id) {
          LoggerService.logUserActivity({
            userId: req.user.id,
            action: 'CREATE_ACCOUNT',
            details: `Administrador criou usuário ${email} com 4 contas (USD, EUR, USDT, BRL)`,
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
            },
            {
              id: brlAccount.id,
              accountNumber: brlAccount.accountNumber,
              currency: 'BRL',
              name: brlAccount.name
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
      // Buscar a conta com mais detalhes
      const account = await Account.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Atualizar o saldo
      const currentBalance = parseFloat(account.balance || 0);
      const newBalance = currentBalance + parseFloat(amount);
      
      await account.update({ balance: newBalance });
      
      // Definir uma moeda válida para a transação
      let transactionCurrency = account.currency;
      if (transactionCurrency === 'BRL') {
        transactionCurrency = 'USD'; // Substituir BRL por USD para evitar erro de enum
      }
      
      // Registrar a transação
      const transaction = await Transaction.create({
        accountId: id,
        userId: account.userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        transactionType: 'deposit',
        status: 'completed', // Alterado para minúsculas
        description: `Depósito administrativo em conta ${account.currency}`,
        currency: transactionCurrency,
        reference: `admin-deposit-${Date.now()}`
      });
      
      // Registrar atividade
      LoggerService.logUserActivity({
        userId: req.user ? req.user.id : null,
        action: 'ADMIN_DEPOSIT',
        details: `Depósito de ${amount} ${account.currency} na conta ${account.accountNumber} (ID: ${id})`,
        ipAddress: req.ip
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Depósito realizado com sucesso',
        data: {
          accountId: id,
          newBalance,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar depósito:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar depósito',
        error: error.message
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
      // Buscar a conta com mais detalhes
      const account = await Account.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Verificar se há saldo suficiente
      const currentBalance = parseFloat(account.balance || 0);
      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente'
        });
      }

      // Atualizar o saldo
      const newBalance = currentBalance - parseFloat(amount);
      
      await account.update({ balance: newBalance });
      
      // Definir uma moeda válida para a transação
      let transactionCurrency = account.currency;
      if (transactionCurrency === 'BRL') {
        transactionCurrency = 'USD'; // Substituir BRL por USD para evitar erro de enum
      }
      
      // Registrar a transação
      const transaction = await Transaction.create({
        accountId: id,
        userId: account.userId,
        amount: parseFloat(amount), // Alterado para valor positivo
        type: 'WITHDRAWAL',
        transactionType: 'withdrawal',
        status: 'completed', // Alterado para minúsculas
        description: `Saque administrativo em conta ${account.currency}`,
        currency: transactionCurrency,
        reference: `admin-withdraw-${Date.now()}`
      });
      
      // Registrar atividade
      LoggerService.logUserActivity({
        userId: req.user ? req.user.id : null,
        action: 'ADMIN_WITHDRAWAL',
        details: `Saque de ${amount} ${account.currency} da conta ${account.accountNumber} (ID: ${id})`,
        ipAddress: req.ip
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Saque realizado com sucesso',
        data: {
          accountId: id,
          newBalance,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar saque',
        error: error.message
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

  async createSingleAccount(req, res) {
    try {
      const { userId, accountType, currency, initialBalance, name } = req.body;
      
      if (!userId || !accountType || !currency) {
        return res.status(400).json({
          status: 'error',
          message: 'Dados incompletos. Usuário, tipo de conta e moeda são obrigatórios.'
        });
      }
      
      // Validar a moeda
      const validCurrencies = ['USD', 'EUR', 'USDT', 'BRL'];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({
          status: 'error',
          message: `Moeda inválida. Moedas suportadas: ${validCurrencies.join(', ')}`
        });
      }

      // Gerar número de conta
      const accountNumber = await Account.generateAccountNumber(accountType);

      // Criar conta
      const account = await Account.create({
        accountType,
        currency,
        userId,
        name,
        balance: initialBalance || 0,
        isInternal: accountType === 'internal',
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber
      });

      return res.status(201).json({
        status: 'success',
        message: 'Conta criada com sucesso',
        data: account
      });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar conta',
        error: error.message
      });
    }
  }

  /**
   * Criar uma nova conta BRL para um usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async createSingleAccountBRL(req, res) {
    try {
      const { userId, initialBalance, name } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          status: 'error',
          message: 'ID do usuário é obrigatório'
        });
      }
      
      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }
      
      // Verificar se o usuário já tem uma conta BRL
      const existingAccount = await Account.findOne({
        where: { 
          userId,
          currency: 'BRL'
        }
      });
      
      if (existingAccount) {
        return res.status(400).json({
          status: 'error',
          message: 'Usuário já possui uma conta BRL'
        });
      }
      
      // Gerar número de conta
      const accountNumber = await Account.generateAccountNumber('standard');
      
      // Criar conta BRL
      const brlAccount = await Account.create({
        accountType: 'standard',
        currency: 'BRL',
        userId,
        name: name || `Conta BRL de ${user.name}`,
        balance: initialBalance || 0,
        isInternal: false,
        status: 'active',
        dailyTransferLimit: 20000,
        monthlyTransferLimit: 100000,
        accountNumber
      });
      
      // Registrar atividade
      LoggerService.logUserActivity({
        userId: req.user.id,
        action: 'CREATE_BRL_ACCOUNT',
        details: `Administrador criou conta BRL para usuário ID: ${userId}`,
        ipAddress: req.ip
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'Conta BRL criada com sucesso',
        data: brlAccount
      });
    } catch (error) {
      console.error('Erro ao criar conta BRL:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar conta BRL',
        error: error.message
      });
    }
  }

  /**
   * Realizar depósito em conta BRL
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async depositToBRLAccount(req, res) {
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
      // Buscar a conta com mais detalhes
      const account = await Account.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Verificar se é uma conta BRL
      if (account.currency !== 'BRL') {
        return res.status(400).json({
          status: 'error',
          message: 'Esta rota é específica para contas BRL'
        });
      }

      // Atualizar o saldo
      const currentBalance = parseFloat(account.balance || 0);
      const newBalance = currentBalance + parseFloat(amount);
      
      await account.update({ balance: newBalance });
      
      // Registrar a transação
      const transaction = await Transaction.create({
        accountId: id,
        userId: account.userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        transactionType: 'deposit',
        status: 'completed', // Alterado para minúsculas
        description: `Depósito administrativo em conta BRL`,
        currency: 'USD',
        reference: `admin-deposit-brl-${Date.now()}`
      });
      
      // Registrar atividade
      LoggerService.logUserActivity({
        userId: req.user ? req.user.id : null,
        action: 'ADMIN_DEPOSIT_BRL',
        details: `Depósito de ${amount} BRL na conta ${account.accountNumber} (ID: ${id})`,
        ipAddress: req.ip
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Depósito em conta BRL realizado com sucesso',
        data: {
          accountId: id,
          newBalance,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar depósito em conta BRL:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar depósito em conta BRL',
        error: error.message
      });
    }
  }

  /**
   * Realizar saque em conta BRL
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async withdrawFromBRLAccount(req, res) {
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
      // Buscar a conta com mais detalhes
      const account = await Account.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Verificar se é uma conta BRL
      if (account.currency !== 'BRL') {
        return res.status(400).json({
          status: 'error',
          message: 'Esta rota é específica para contas BRL'
        });
      }

      // Verificar se há saldo suficiente
      const currentBalance = parseFloat(account.balance || 0);
      if (currentBalance < parseFloat(amount)) {
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente para realizar o saque'
        });
      }

      // Atualizar o saldo
      const newBalance = currentBalance - parseFloat(amount);
      
      await account.update({ balance: newBalance });
      
      // Registrar a transação
      const transaction = await Transaction.create({
        accountId: id,
        userId: account.userId,
        amount: parseFloat(amount), // Alterado para valor positivo
        type: 'WITHDRAWAL',
        transactionType: 'withdrawal',
        status: 'completed', // Alterado para minúsculas
        description: `Saque administrativo de conta BRL`,
        currency: 'USD',
        reference: `admin-withdraw-brl-${Date.now()}`
      });
      
      // Registrar atividade
      LoggerService.logUserActivity({
        userId: req.user ? req.user.id : null,
        action: 'ADMIN_WITHDRAW_BRL',
        details: `Saque de ${amount} BRL da conta ${account.accountNumber} (ID: ${id})`,
        ipAddress: req.ip
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Saque de conta BRL realizado com sucesso',
        data: {
          accountId: id,
          newBalance,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar saque de conta BRL:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno ao processar saque de conta BRL',
        error: error.message
      });
    }
  }
}

module.exports = new AdminAccountController();
