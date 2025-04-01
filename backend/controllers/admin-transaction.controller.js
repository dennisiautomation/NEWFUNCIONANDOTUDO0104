const db = require('../pg-models');
const Transaction = db.Transaction;
const Account = db.Account;
const User = db.User;
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

/**
 * Controller para gerenciamento de transações pelo administrador
 */
const adminTransactionController = {
  /**
   * Obter todas as transações com filtros e paginação
   * @param {*} req Requisição
   * @param {*} res Resposta
   */
  getTransactions: async (req, res) => {
    try {
      // Parâmetros de paginação
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Construir filtros
      const filters = {};
      
      // Filtro de período
      if (req.query.startDate && req.query.endDate) {
        filters.createdAt = {
          [Op.between]: [
            new Date(`${req.query.startDate}T00:00:00Z`),
            new Date(`${req.query.endDate}T23:59:59Z`)
          ]
        };
      } else if (req.query.startDate) {
        filters.createdAt = {
          [Op.gte]: new Date(`${req.query.startDate}T00:00:00Z`)
        };
      } else if (req.query.endDate) {
        filters.createdAt = {
          [Op.lte]: new Date(`${req.query.endDate}T23:59:59Z`)
        };
      }
      
      // Outros filtros
      if (req.query.transactionType) {
        filters.transactionType = req.query.transactionType;
      }
      
      if (req.query.currency) {
        filters.currency = req.query.currency;
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      // Filtro por valor
      if (req.query.minAmount || req.query.maxAmount) {
        filters.amount = {};
        
        if (req.query.minAmount) {
          filters.amount[Op.gte] = parseFloat(req.query.minAmount);
        }
        
        if (req.query.maxAmount) {
          filters.amount[Op.lte] = parseFloat(req.query.maxAmount);
        }
      }
      
      // Incluir relacionamentos
      const include = [];
      
      // Filtros adicionais para contas
      const accountFilters = {};
      let accountIncluded = false;
      
      if (req.query.accountNumber) {
        accountFilters[Op.or] = [
          { sourceAccountNumber: req.query.accountNumber },
          { destinationAccountNumber: req.query.accountNumber }
        ];
        accountIncluded = true;
      }
      
      // Filtro por usuário
      if (req.query.userId) {
        include.push({
          model: User,
          as: 'sourceUser',
          where: { id: req.query.userId },
          required: false
        });
        
        include.push({
          model: User,
          as: 'destinationUser',
          where: { id: req.query.userId },
          required: false
        });
        
        // Se estamos filtrando por usuário, precisamos ajustar a query
        filters[Op.or] = [
          { '$sourceUser.id$': req.query.userId },
          { '$destinationUser.id$': req.query.userId }
        ];
      }
      
      // Buscar transações com paginação
      const { count, rows } = await Transaction.findAndCountAll({
        where: filters,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include,
        distinct: true
      });
      
      // Buscar métricas para o dashboard
      const metrics = await getTransactionMetrics(filters);
      
      // Retornar resultados
      return res.status(200).json({
        status: 'success',
        message: 'Transações recuperadas com sucesso',
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit,
        data: rows,
        metrics
      });
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Falha ao recuperar transações',
        error: error.message
      });
    }
  },
  
  /**
   * Exportar transações para CSV
   * @param {*} req Requisição
   * @param {*} res Resposta
   */
  exportTransactions: async (req, res) => {
    try {
      // Construir filtros da mesma forma que o endpoint getTransactions
      const filters = {};
      
      if (req.query.startDate && req.query.endDate) {
        filters.createdAt = {
          [Op.between]: [
            new Date(`${req.query.startDate}T00:00:00Z`),
            new Date(`${req.query.endDate}T23:59:59Z`)
          ]
        };
      } else if (req.query.startDate) {
        filters.createdAt = {
          [Op.gte]: new Date(`${req.query.startDate}T00:00:00Z`)
        };
      } else if (req.query.endDate) {
        filters.createdAt = {
          [Op.lte]: new Date(`${req.query.endDate}T23:59:59Z`)
        };
      }
      
      if (req.query.transactionType) {
        filters.transactionType = req.query.transactionType;
      }
      
      if (req.query.currency) {
        filters.currency = req.query.currency;
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      if (req.query.minAmount || req.query.maxAmount) {
        filters.amount = {};
        
        if (req.query.minAmount) {
          filters.amount[Op.gte] = parseFloat(req.query.minAmount);
        }
        
        if (req.query.maxAmount) {
          filters.amount[Op.lte] = parseFloat(req.query.maxAmount);
        }
      }
      
      // Incluir relacionamentos
      const include = [];
      
      // Filtros adicionais para contas
      const accountFilters = {};
      let accountIncluded = false;
      
      if (req.query.accountNumber) {
        accountFilters[Op.or] = [
          { sourceAccountNumber: req.query.accountNumber },
          { destinationAccountNumber: req.query.accountNumber }
        ];
        accountIncluded = true;
      }
      
      // Filtro por usuário
      if (req.query.userId) {
        include.push({
          model: User,
          as: 'sourceUser',
          where: { id: req.query.userId },
          required: false
        });
        
        include.push({
          model: User,
          as: 'destinationUser',
          where: { id: req.query.userId },
          required: false
        });
        
        // Se estamos filtrando por usuário, precisamos ajustar a query
        filters[Op.or] = [
          { '$sourceUser.id$': req.query.userId },
          { '$destinationUser.id$': req.query.userId }
        ];
      }
      
      // Buscar todas as transações para exportação (sem paginação)
      const transactions = await Transaction.findAll({
        where: filters,
        order: [['createdAt', 'DESC']],
        include,
        raw: true,
        nest: true
      });
      
      // Preparar dados para CSV
      const csvData = transactions.map(transaction => {
        // Formatar datas
        const createdAt = new Date(transaction.createdAt)
          .toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        
        // Formatar status
        let status = '';
        switch (transaction.status) {
          case 'completed':
            status = 'Completo';
            break;
          case 'pending':
            status = 'Pendente';
            break;
          case 'failed':
            status = 'Falhou';
            break;
          default:
            status = transaction.status;
        }
        
        // Formatar tipo
        let type = '';
        switch (transaction.transactionType) {
          case 'deposit':
            type = 'Depósito';
            break;
          case 'withdrawal':
            type = 'Saque';
            break;
          case 'transfer':
            type = 'Transferência';
            break;
          default:
            type = transaction.transactionType;
        }
        
        // Retornar objeto formatado
        return {
          ID: transaction.id,
          Data: createdAt,
          Tipo: type,
          'Conta Origem': transaction.sourceAccountNumber || '-',
          'Conta Destino': transaction.destinationAccountNumber || '-',
          Valor: transaction.amount,
          Moeda: transaction.currency,
          Status: status,
          Descrição: transaction.description || '-'
        };
      });
      
      // Converter para CSV
      const parser = new Parser({
        fields: [
          'ID',
          'Data',
          'Tipo',
          'Conta Origem',
          'Conta Destino',
          'Valor',
          'Moeda',
          'Status',
          'Descrição'
        ]
      });
      
      const csv = parser.parse(csvData);
      
      // Configurar cabeçalhos para download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions_report.csv');
      
      // Enviar CSV
      return res.status(200).send(csv);
    } catch (error) {
      console.error('Erro ao exportar transações:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Falha ao exportar transações',
        error: error.message
      });
    }
  },
  
  /**
   * Obter detalhes de uma transação específica
   * @param {*} req Requisição
   * @param {*} res Resposta
   */
  getTransactionDetails: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar transação com todas as informações relacionadas
      const transaction = await Transaction.findByPk(id, {
        include: [
          {
            model: User,
            as: 'sourceUser',
            attributes: ['id', 'name', 'email', 'documentNumber']
          },
          {
            model: User,
            as: 'destinationUser',
            attributes: ['id', 'name', 'email', 'documentNumber']
          }
        ]
      });
      
      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transação não encontrada'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Detalhes da transação recuperados com sucesso',
        data: transaction
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da transação:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Falha ao recuperar detalhes da transação',
        error: error.message
      });
    }
  }
};

/**
 * Função auxiliar para calcular métricas de transações
 * @param {Object} filters Filtros aplicados
 * @returns {Object} Métricas calculadas
 */
async function getTransactionMetrics(filters) {
  try {
    // Criar cópia dos filtros para não afetar a consulta original
    const metricFilters = { ...filters };
    
    // Para métricas, consideramos apenas transações completadas
    metricFilters.status = 'completed';
    
    // Buscar volume total
    const totalVolume = await Transaction.sum('amount', {
      where: metricFilters
    }) || 0;
    
    // Buscar volume por tipo de transação
    const volumeByType = {};
    
    // Depósitos
    const depositFilters = { ...metricFilters, transactionType: 'deposit' };
    volumeByType.deposit = await Transaction.sum('amount', {
      where: depositFilters
    }) || 0;
    
    // Saques
    const withdrawalFilters = { ...metricFilters, transactionType: 'withdrawal' };
    volumeByType.withdrawal = await Transaction.sum('amount', {
      where: withdrawalFilters
    }) || 0;
    
    // Transferências
    const transferFilters = { ...metricFilters, transactionType: 'transfer' };
    volumeByType.transfer = await Transaction.sum('amount', {
      where: transferFilters
    }) || 0;
    
    // Buscar volume por moeda
    const volumeByCurrency = {};
    
    // USD
    const usdFilters = { ...metricFilters, currency: 'USD' };
    volumeByCurrency.USD = await Transaction.sum('amount', {
      where: usdFilters
    }) || 0;
    
    // EUR
    const eurFilters = { ...metricFilters, currency: 'EUR' };
    volumeByCurrency.EUR = await Transaction.sum('amount', {
      where: eurFilters
    }) || 0;
    
    // USDT
    const usdtFilters = { ...metricFilters, currency: 'USDT' };
    volumeByCurrency.USDT = await Transaction.sum('amount', {
      where: usdtFilters
    }) || 0;
    
    return {
      totalVolume,
      volumeByType,
      volumeByCurrency
    };
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    return {
      totalVolume: 0,
      volumeByType: {
        deposit: 0,
        withdrawal: 0,
        transfer: 0
      },
      volumeByCurrency: {
        USD: 0,
        EUR: 0,
        USDT: 0
      }
    };
  }
}

module.exports = adminTransactionController;
