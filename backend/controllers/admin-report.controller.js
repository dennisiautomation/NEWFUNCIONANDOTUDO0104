const Transaction = require('../models/transaction.model');
const Account = require('../models/account.model');
const User = require('../models/user.model');
const LoggerService = require('../services/logger.service');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para relatórios administrativos
 */
class AdminReportController {
  /**
   * Obtém um relatório de todas as transações com filtros e paginação
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getAllTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        type,
        currency,
        minAmount,
        maxAmount,
        status,
        userId,
        accountId
      } = req.query;

      // Constrói o filtro baseado nos parâmetros da requisição
      const filter = {};
      
      if (type) filter.type = type;
      if (currency) filter.currency = currency;
      if (status) filter.status = status;
      if (userId) {
        const userAccounts = await Account.find({ userId }).select('_id');
        const accountIds = userAccounts.map(acc => acc._id);
        
        filter.$or = [
          { sourceAccountId: { $in: accountIds } },
          { destinationAccountId: { $in: accountIds } }
        ];
      }
      if (accountId) {
        filter.$or = [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId }
        ];
      }
      
      // Filtro de valor
      if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
      }
      
      // Filtro de data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Executa a consulta com paginação
      const options = {
        sort: { createdAt: -1 },
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      // Obtém as transações e a contagem total
      const [transactions, total] = await Promise.all([
        Transaction.find(filter, null, options)
          .populate('sourceAccountId', 'accountNumber')
          .populate('destinationAccountId', 'accountNumber'),
        Transaction.countDocuments(filter)
      ]);

      // Registra a atividade de visualização do relatório
      LoggerService.logUserActivity(
        'view_admin_transactions_report',
        req.user.id,
        { filter, page, limit }
      );

      res.json({
        status: 'success',
        data: {
          transactions,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'AdminReportController.getAllTransactions',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter relatório de transações',
        error: error.message
      });
    }
  }

  /**
   * Obtém um relatório de todas as contas com filtros e paginação
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getAllAccounts(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        type,
        currency,
        minBalance,
        maxBalance,
        status,
        userId
      } = req.query;

      // Constrói o filtro baseado nos parâmetros da requisição
      const filter = {};
      
      if (type) filter.type = type;
      if (currency) filter.currency = currency;
      if (status) filter.status = status;
      if (userId) filter.userId = userId;
      
      // Filtro de saldo
      if (minBalance || maxBalance) {
        filter.balance = {};
        if (minBalance) filter.balance.$gte = parseFloat(minBalance);
        if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
      }

      // Executa a consulta com paginação
      const options = {
        sort: { createdAt: -1 },
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      // Obtém as contas e a contagem total
      const [accounts, total] = await Promise.all([
        Account.find(filter, null, options)
          .populate('userId', 'name email'),
        Account.countDocuments(filter)
      ]);

      // Registra a atividade de visualização do relatório
      LoggerService.logUserActivity(
        'view_admin_accounts_report',
        req.user.id,
        { filter, page, limit }
      );

      res.json({
        status: 'success',
        data: {
          accounts,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'AdminReportController.getAllAccounts',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter relatório de contas',
        error: error.message
      });
    }
  }

  /**
   * Obtém um dashboard com estatísticas gerais do sistema
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getDashboardStats(req, res) {
    try {
      // Período para estatísticas (últimos 30 dias por padrão)
      const { period = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Estatísticas de usuários
      const userStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      // Total de usuários
      const totalUsers = await User.countDocuments();

      // Estatísticas de contas
      const accountStats = await Account.aggregate([
        {
          $group: {
            _id: {
              type: '$type',
              currency: '$currency'
            },
            count: { $sum: 1 },
            totalBalance: { $sum: '$balance' }
          }
        }
      ]);

      // Total de contas
      const totalAccounts = await Account.countDocuments();

      // Estatísticas de transações
      const transactionStats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              currency: '$currency'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Total de transações no período
      const totalTransactions = await Transaction.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Transações por dia (para gráfico)
      const transactionsByDay = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1
          }
        }
      ]);

      // Formata os dados para o gráfico
      const chartData = transactionsByDay.map(day => ({
        date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
        count: day.count,
        totalAmount: day.totalAmount
      }));

      // Registra a atividade de visualização do dashboard
      LoggerService.logUserActivity(
        'view_admin_dashboard',
        req.user.id,
        { period }
      );

      res.json({
        status: 'success',
        data: {
          users: {
            total: totalUsers,
            byRole: userStats
          },
          accounts: {
            total: totalAccounts,
            byTypeAndCurrency: accountStats
          },
          transactions: {
            total: totalTransactions,
            byTypeAndCurrency: transactionStats,
            chartData
          }
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'AdminReportController.getDashboardStats',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter estatísticas do dashboard',
        error: error.message
      });
    }
  }

  /**
   * Gera um relatório em PDF com as transações filtradas
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async generateTransactionsPdf(req, res) {
    try {
      const {
        startDate,
        endDate,
        type,
        currency,
        minAmount,
        maxAmount,
        status,
        userId,
        accountId
      } = req.query;

      // Constrói o filtro baseado nos parâmetros da requisição
      const filter = {};
      
      if (type) filter.type = type;
      if (currency) filter.currency = currency;
      if (status) filter.status = status;
      if (userId) {
        const userAccounts = await Account.find({ userId }).select('_id');
        const accountIds = userAccounts.map(acc => acc._id);
        
        filter.$or = [
          { sourceAccountId: { $in: accountIds } },
          { destinationAccountId: { $in: accountIds } }
        ];
      }
      if (accountId) {
        filter.$or = [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId }
        ];
      }
      
      // Filtro de valor
      if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
      }
      
      // Filtro de data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Obtém as transações
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .populate('sourceAccountId', 'accountNumber')
        .populate('destinationAccountId', 'accountNumber')
        .limit(1000); // Limita a 1000 transações para evitar PDFs muito grandes

      // Cria um novo documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Define o nome do arquivo
      const fileName = `relatorio_transacoes_${new Date().toISOString().slice(0, 10)}.pdf`;
      const filePath = path.join(__dirname, '..', 'temp', fileName);
      
      // Garante que o diretório temp existe
      if (!fs.existsSync(path.join(__dirname, '..', 'temp'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'temp'), { recursive: true });
      }
      
      // Cria o stream de escrita para o arquivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Adiciona o cabeçalho do relatório
      doc.fontSize(20).text('NewCash Bank', { align: 'center' });
      doc.fontSize(16).text('Relatório de Transações', { align: 'center' });
      doc.moveDown();

      // Adiciona os filtros aplicados
      doc.fontSize(12).text('Filtros aplicados:', { underline: true });
      if (startDate || endDate) {
        doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString() : 'Início'} a ${endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}`);
      }
      if (type) doc.text(`Tipo: ${type}`);
      if (currency) doc.text(`Moeda: ${currency}`);
      if (minAmount || maxAmount) {
        doc.text(`Valor: ${minAmount ? minAmount : '0'} a ${maxAmount ? maxAmount : 'ilimitado'}`);
      }
      if (status) doc.text(`Status: ${status}`);
      if (userId) doc.text(`ID do Usuário: ${userId}`);
      if (accountId) doc.text(`ID da Conta: ${accountId}`);
      doc.moveDown();

      // Adiciona o total de transações
      doc.text(`Total de transações: ${transactions.length}`);
      doc.moveDown();

      // Tabela de transações
      doc.fontSize(10);
      
      // Cabeçalho da tabela
      const tableTop = doc.y;
      const tableHeaders = ['Data', 'Tipo', 'Origem', 'Destino', 'Valor', 'Status'];
      const columnWidths = [80, 70, 100, 100, 80, 70];
      
      let currentY = tableTop;
      
      // Desenha o cabeçalho da tabela
      doc.font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        let x = 50;
        for (let j = 0; j < i; j++) {
          x += columnWidths[j];
        }
        doc.text(header, x, currentY, { width: columnWidths[i], align: 'left' });
      });
      
      doc.font('Helvetica');
      currentY += 20;
      
      // Desenha uma linha horizontal após o cabeçalho
      doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
      
      // Adiciona as transações
      transactions.forEach(transaction => {
        // Verifica se precisa adicionar uma nova página
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
          
          // Redesenha o cabeçalho da tabela na nova página
          doc.font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            let x = 50;
            for (let j = 0; j < i; j++) {
              x += columnWidths[j];
            }
            doc.text(header, x, currentY, { width: columnWidths[i], align: 'left' });
          });
          
          doc.font('Helvetica');
          currentY += 20;
          
          // Desenha uma linha horizontal após o cabeçalho
          doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
        }
        
        // Data
        doc.text(new Date(transaction.createdAt).toLocaleDateString(), 50, currentY, { width: columnWidths[0], align: 'left' });
        
        // Tipo
        doc.text(transaction.type, 50 + columnWidths[0], currentY, { width: columnWidths[1], align: 'left' });
        
        // Origem
        const sourceAccount = transaction.sourceAccountId ? 
          (typeof transaction.sourceAccountId === 'object' ? transaction.sourceAccountId.accountNumber : 'Conta Externa') : 
          'N/A';
        doc.text(sourceAccount, 50 + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: 'left' });
        
        // Destino
        const destAccount = transaction.destinationAccountId ? 
          (typeof transaction.destinationAccountId === 'object' ? transaction.destinationAccountId.accountNumber : 'Conta Externa') : 
          'N/A';
        doc.text(destAccount, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3], align: 'left' });
        
        // Valor
        doc.text(`${transaction.amount.toFixed(2)} ${transaction.currency}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY, { width: columnWidths[4], align: 'right' });
        
        // Status
        doc.text(transaction.status, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], currentY, { width: columnWidths[5], align: 'left' });
        
        currentY += 20;
      });
      
      // Adiciona uma linha horizontal no final da tabela
      doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
      
      // Adiciona o rodapé
      doc.fontSize(8).text(`Documento gerado em ${new Date().toLocaleString()} por ${req.user.name || 'Administrador'}`, 50, 750, { align: 'center' });
      
      // Finaliza o documento
      doc.end();
      
      // Espera o stream terminar
      stream.on('finish', () => {
        // Registra a atividade de geração de relatório em PDF
        LoggerService.logUserActivity(
          'generate_admin_transactions_pdf',
          req.user.id,
          {
            filter: req.query,
            fileName,
            transactionCount: transactions.length
          }
        );
        
        // Envia o arquivo para download
        res.download(filePath, fileName, (err) => {
          if (err) {
            LoggerService.logSystemError(err, {
              context: 'AdminReportController.generateTransactionsPdf',
              filePath
            });
          }
          
          // Remove o arquivo temporário após o download
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              LoggerService.logSystemError(unlinkErr, {
                context: 'AdminReportController.generateTransactionsPdf.cleanup',
                filePath
              });
            }
          });
        });
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'AdminReportController.generateTransactionsPdf',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao gerar relatório de transações em PDF',
        error: error.message
      });
    }
  }
}

module.exports = new AdminReportController();
