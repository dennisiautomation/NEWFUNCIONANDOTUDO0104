/**
 * Controlador para gerenciar contas BRL
 */
const LoggerService = require('../services/logger.service');

class BRLAccountController {
  constructor() {
    this.logger = new LoggerService('BRLAccountController');
  }
  
  /**
   * Obter dados da conta BRL
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getBRLAccount(req, res) {
    try {
      this.logger.info('Buscando dados da conta BRL');
      
      // Obter o ID do usuário da requisição
      const userId = req.user ? req.user.id : null;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado'
        });
      }
      
      // Importar modelo de conta
      const { Account } = require('../pg-models');
      
      // Buscar a conta BRL do usuário
      const brlAccount = await Account.findOne({
        where: { 
          userId,
          currency: 'BRL'
        }
      });
      
      if (!brlAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta BRL não encontrada'
        });
      }
      
      // Formatar os dados conforme esperado pelo frontend
      const accountData = {
        id: brlAccount.id,
        accountNumber: brlAccount.accountNumber,
        accountType: brlAccount.accountType,
        balance: parseFloat(brlAccount.balance),
        currency: 'BRL',
        status: brlAccount.status,
        lastUpdated: brlAccount.updatedAt
      };
      
      return res.status(200).json({
        status: 'success',
        data: accountData
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar dados da conta BRL: ${error.message}`);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar dados da conta BRL',
        error: error.message
      });
    }
  }

  /**
   * Obter transações da conta BRL
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getBRLTransactions(req, res) {
    try {
      this.logger.info('Buscando transações da conta BRL');
      
      // Obter o ID do usuário da requisição
      const userId = req.user ? req.user.id : null;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado'
        });
      }
      
      // Importar modelos
      const { Account, Transaction } = require('../pg-models');
      
      // Buscar a conta BRL do usuário
      const brlAccount = await Account.findOne({
        where: { 
          userId,
          currency: 'BRL'
        }
      });
      
      if (!brlAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta BRL não encontrada'
        });
      }
      
      // Buscar transações da conta
      const transactions = await Transaction.findAll({
        where: {
          accountId: brlAccount.id
        },
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          accountNumber: brlAccount.accountNumber,
          currency: 'BRL',
          transactions: transactions.map(tx => ({
            id: tx.id,
            date: tx.createdAt,
            description: tx.description,
            amount: parseFloat(tx.amount),
            type: tx.type,
            status: tx.status
          }))
        }
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar transações da conta BRL: ${error.message}`);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar transações da conta BRL',
        error: error.message
      });
    }
  }

  /**
   * Criar uma nova conta BRL
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async createBRLAccount(req, res) {
    try {
      this.logger.info('Criando nova conta BRL');
      
      // Obter o ID do usuário da requisição
      const userId = req.user ? req.user.id : null;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado'
        });
      }
      
      // Importar modelo de conta
      const { Account } = require('../pg-models');
      
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
      
      // Criar nova conta
      const newAccount = await Account.create({
        userId,
        name: 'Conta Real',
        accountType: 'standard',
        currency: 'BRL',
        balance: 0,
        status: 'active',
        dailyTransferLimit: 20000,
        monthlyTransferLimit: 100000
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'Conta BRL criada com sucesso',
        data: newAccount
      });
    } catch (error) {
      this.logger.error(`Erro ao criar conta BRL: ${error.message}`);
      
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar conta BRL',
        error: error.message
      });
    }
  }
}

module.exports = new BRLAccountController();
