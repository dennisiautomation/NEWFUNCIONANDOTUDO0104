const axios = require('axios');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const Account = require('../models/account.model');
const { ftApiService } = require('../services/ftApi.service');

/**
 * Controlador para gerenciar transações
 */
const TransactionController = {
  /**
   * Obtém todas as transações com filtros opcionais (para admins)
   */
  getTransactions: async (req, res) => {
    try {
      const { type, status, accountId, userId, startDate, endDate, page = 1, limit = 20 } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (accountId) filter.accountId = accountId;
      if (userId) filter.userId = userId;
      
      // Filtro de data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Paginação
      const skip = (page - 1) * limit;
      
      // Buscar transações no banco de dados
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('accountId', 'accountNumber balance currency')
        .populate('userId', 'firstName lastName email');
      
      const totalTransactions = await Transaction.countDocuments(filter);
      
      return res.json({
        status: 'success',
        data: transactions,
        pagination: {
          total: totalTransactions,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalTransactions / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar transações',
        error: error.message
      });
    }
  },
  
  /**
   * Obtém transações de uma conta específica
   */
  getAccountTransactions: async (req, res) => {
    try {
      const { accountId } = req.params;
      const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
      
      // Verificar se a conta existe
      const account = await Account.findById(accountId);
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }
      
      // Verificar permissão do usuário (só pode ver suas próprias contas, a menos que seja admin)
      if (account.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado: você não tem permissão para ver transações desta conta'
        });
      }
      
      // Construir filtros
      const filter = { accountId };
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      // Filtro de data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Paginação
      const skip = (page - 1) * limit;
      
      // Buscar transações no banco de dados
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('accountId', 'accountNumber balance currency')
        .populate('userId', 'firstName lastName email');
      
      const totalTransactions = await Transaction.countDocuments(filter);
      
      return res.json({
        status: 'success',
        data: transactions,
        pagination: {
          total: totalTransactions,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalTransactions / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar transações da conta:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar transações da conta',
        error: error.message
      });
    }
  },
  
  /**
   * Obtém transações do usuário logado
   */
  getUserTransactions: async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 20, type, status, accountId, startDate, endDate } = req.query;
      
      // Construir filtros
      const filter = { userId };
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (accountId) filter.accountId = accountId;
      
      // Filtro de data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Paginação
      const skip = (page - 1) * limit;
      
      // Buscar transações no banco de dados
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('accountId', 'accountNumber balance currency');
      
      const totalTransactions = await Transaction.countDocuments(filter);
      
      return res.json({
        status: 'success',
        data: transactions,
        pagination: {
          total: totalTransactions,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalTransactions / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar transações do usuário:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar transações do usuário',
        error: error.message
      });
    }
  },
  
  /**
   * Obtém detalhes de uma transação específica
   */
  getTransactionDetails: async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      // Buscar transação no banco de dados
      const transaction = await Transaction.findById(transactionId)
        .populate('accountId', 'accountNumber balance currency')
        .populate('userId', 'firstName lastName email');
      
      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transação não encontrada'
        });
      }
      
      // Verificar permissão do usuário (só pode ver suas próprias transações, a menos que seja admin)
      if (transaction.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado: você não tem permissão para ver esta transação'
        });
      }
      
      return res.json({
        status: 'success',
        data: transaction
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da transação:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar detalhes da transação',
        error: error.message
      });
    }
  },
  
  /**
   * Inicia uma transação de transferência
   */
  initiateTransaction: async (req, res) => {
    try {
      const { accountId, targetAccount, amount, description, type } = req.body;
      const userId = req.user._id;
      
      // Verificar se a conta de origem existe
      const sourceAccount = await Account.findById(accountId);
      if (!sourceAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta de origem não encontrada'
        });
      }
      
      // Verificar se o usuário é dono da conta
      if (sourceAccount.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado: você não é o proprietário desta conta'
        });
      }
      
      // Verificar se há saldo suficiente
      if (sourceAccount.balance < amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente para realizar esta transação'
        });
      }
      
      // Criar a transação com status 'PENDING'
      const newTransaction = new Transaction({
        type: type || 'TRANSFER',
        amount: amount,
        description: description || 'Transferência',
        status: 'PENDING',
        accountId: accountId,
        userId: userId,
        targetAccount: targetAccount
      });
      
      // Salvar a transação
      await newTransaction.save();
      
      return res.json({
        status: 'success',
        message: 'Transação iniciada com sucesso',
        data: newTransaction
      });
    } catch (error) {
      console.error('Erro ao iniciar transação:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao iniciar transação',
        error: error.message
      });
    }
  },
  
  /**
   * Confirma e executa uma transação pendente
   */
  confirmTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      // Buscar a transação
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transação não encontrada'
        });
      }
      
      // Verificar se o usuário é o dono da transação
      if (transaction.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado: você não é o proprietário desta transação'
        });
      }
      
      // Verificar se a transação está pendente
      if (transaction.status !== 'PENDING') {
        return res.status(400).json({
          status: 'error',
          message: `Esta transação não pode ser confirmada, status atual: ${transaction.status}`
        });
      }
      
      // Obter a conta de origem
      const sourceAccount = await Account.findById(transaction.accountId);
      if (!sourceAccount) {
        transaction.status = 'FAILED';
        transaction.statusDetail = 'Conta de origem não encontrada';
        await transaction.save();
        
        return res.status(400).json({
          status: 'error',
          message: 'Conta de origem não encontrada'
        });
      }
      
      // Verificar saldo novamente
      if (sourceAccount.balance < transaction.amount) {
        transaction.status = 'FAILED';
        transaction.statusDetail = 'Saldo insuficiente';
        await transaction.save();
        
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente para realizar esta transação'
        });
      }
      
      // Se for transferência para outra conta no mesmo banco
      if (transaction.type === 'TRANSFER' && transaction.targetAccount) {
        // Atualizar contas (reduzir saldo da origem)
        sourceAccount.balance -= transaction.amount;
        await sourceAccount.save();
        
        // Para transferências internas
        if (!transaction.targetAccount.includes('@')) {
          // Buscar conta de destino pelo número da conta
          const targetAccount = await Account.findOne({ accountNumber: transaction.targetAccount });
          if (targetAccount) {
            // Aumentar saldo da conta de destino
            targetAccount.balance += transaction.amount;
            await targetAccount.save();
            
            // Registrar transação de recebimento para a conta de destino
            const receivingTransaction = new Transaction({
              type: 'DEPOSIT',
              amount: transaction.amount,
              description: `Recebido de ${req.user.firstName} ${req.user.lastName}`,
              status: 'COMPLETED',
              accountId: targetAccount._id,
              userId: targetAccount.userId,
              sourceTransaction: transaction._id
            });
            await receivingTransaction.save();
          }
        } else {
          // Para transferências externas (FT API)
          try {
            // Chamar serviço da FT API para transferência
            const ftResult = await ftApiService.sendTransfer({
              targetAccount: transaction.targetAccount,
              amount: transaction.amount,
              description: transaction.description,
              currency: sourceAccount.currency
            });
            
            if (!ftResult.success) {
              // Reverter a dedução da conta de origem
              sourceAccount.balance += transaction.amount;
              await sourceAccount.save();
              
              transaction.status = 'FAILED';
              transaction.statusDetail = ftResult.error || 'Falha na transferência externa';
              await transaction.save();
              
              return res.status(400).json({
                status: 'error',
                message: ftResult.error || 'Falha na transferência externa'
              });
            }
            
            // Adicionar dados da resposta da API à transação
            transaction.externalReference = ftResult.referenceId;
          } catch (error) {
            // Reverter a dedução da conta de origem
            sourceAccount.balance += transaction.amount;
            await sourceAccount.save();
            
            transaction.status = 'FAILED';
            transaction.statusDetail = 'Erro ao processar transferência externa: ' + error.message;
            await transaction.save();
            
            return res.status(500).json({
              status: 'error',
              message: 'Erro ao processar transferência externa',
              error: error.message
            });
          }
        }
      }
      
      // Atualizar status da transação
      transaction.status = 'COMPLETED';
      transaction.completedAt = new Date();
      await transaction.save();
      
      return res.json({
        status: 'success',
        message: 'Transação confirmada e processada com sucesso',
        data: transaction
      });
    } catch (error) {
      console.error('Erro ao confirmar transação:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao confirmar transação',
        error: error.message
      });
    }
  }
};

module.exports = TransactionController;
