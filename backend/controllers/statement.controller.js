const Transaction = require('../models/transaction.model');
const Account = require('../models/account.model');
const User = require('../models/user.model');
const LoggerService = require('../services/logger.service');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para gerenciamento de extratos e relatórios financeiros
 */
class StatementController {
  /**
   * Obtém o extrato de transações de uma conta
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getAccountStatement(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, type, limit = 50, page = 1 } = req.query;

      // Verifica se a conta existe e pertence ao usuário atual
      // (a menos que seja um administrador)
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Se não for administrador, verifica se a conta pertence ao usuário
      if (req.user.role !== 'admin' && account.userId.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para acessar esta conta'
        });
      }

      // Constrói o filtro para buscar as transações
      const filter = {
        $or: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId }
        ]
      };

      // Adiciona filtro de data se fornecido
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Adiciona filtro por tipo de transação se fornecido
      if (type) {
        filter.type = type;
      }

      // Calcula o número de documentos a pular para paginação
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Busca as transações com paginação
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Conta o total de transações para paginação
      const total = await Transaction.countDocuments(filter);

      // Registra a atividade de visualização de extrato
      LoggerService.logUserActivity(
        'view_account_statement',
        req.user.id,
        {
          accountId,
          startDate,
          endDate,
          type,
          page,
          limit
        }
      );

      // Formata as transações para o extrato
      const formattedTransactions = transactions.map(transaction => {
        const isDebit = transaction.sourceAccountId && 
                        transaction.sourceAccountId.toString() === accountId;
        
        return {
          id: transaction._id,
          date: transaction.createdAt,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          isDebit,
          balance: null, // Será calculado posteriormente se necessário
          status: transaction.status,
          reference: transaction.reference || null
        };
      });

      res.json({
        status: 'success',
        data: {
          account: {
            id: account._id,
            number: account.accountNumber,
            type: account.type,
            currency: account.currency,
            currentBalance: account.balance
          },
          transactions: formattedTransactions,
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
        context: 'StatementController.getAccountStatement',
        accountId: req.params.accountId,
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter extrato da conta',
        error: error.message
      });
    }
  }

  /**
   * Gera um extrato em PDF para download
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async generatePdfStatement(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, type } = req.query;

      // Verifica se a conta existe e pertence ao usuário atual
      const account = await Account.findById(accountId);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta não encontrada'
        });
      }

      // Se não for administrador, verifica se a conta pertence ao usuário
      if (req.user.role !== 'admin' && account.userId.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para acessar esta conta'
        });
      }

      // Busca informações do usuário
      const user = await User.findById(account.userId);

      // Constrói o filtro para buscar as transações
      const filter = {
        $or: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId }
        ]
      };

      // Adiciona filtro de data se fornecido
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Adiciona filtro por tipo de transação se fornecido
      if (type) {
        filter.type = type;
      }

      // Busca as transações
      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 });

      // Cria um novo documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Define o nome do arquivo
      const fileName = `extrato_${account.accountNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const filePath = path.join(__dirname, '..', 'temp', fileName);
      
      // Garante que o diretório temp existe
      if (!fs.existsSync(path.join(__dirname, '..', 'temp'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'temp'), { recursive: true });
      }
      
      // Cria o stream de escrita para o arquivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Adiciona o cabeçalho do extrato
      doc.fontSize(20).text('NewCash Bank', { align: 'center' });
      doc.fontSize(16).text('Extrato Bancário', { align: 'center' });
      doc.moveDown();

      // Informações da conta e do cliente
      doc.fontSize(12).text(`Cliente: ${user.name}`);
      doc.text(`Conta: ${account.accountNumber}`);
      doc.text(`Tipo: ${account.type}`);
      doc.text(`Moeda: ${account.currency}`);
      doc.text(`Saldo Atual: ${account.balance.toFixed(2)} ${account.currency}`);
      doc.moveDown();

      // Período do extrato
      doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString() : 'Início'} a ${endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}`);
      doc.moveDown();

      // Tabela de transações
      doc.fontSize(10);
      
      // Cabeçalho da tabela
      const tableTop = doc.y;
      const tableHeaders = ['Data', 'Tipo', 'Descrição', 'Valor', 'Saldo'];
      const columnWidths = [80, 80, 180, 80, 80];
      
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
      let runningBalance = account.balance;
      
      // Inverte a ordem para calcular o saldo progressivo (do mais antigo para o mais recente)
      const sortedTransactions = [...transactions].sort((a, b) => a.createdAt - b.createdAt);
      
      // Calcula os saldos
      const transactionsWithBalance = sortedTransactions.map(transaction => {
        const isDebit = transaction.sourceAccountId && 
                        transaction.sourceAccountId.toString() === accountId;
        
        if (isDebit) {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }
        
        return {
          ...transaction.toObject(),
          balance: runningBalance,
          isDebit
        };
      });
      
      // Inverte de volta para exibir do mais recente para o mais antigo
      transactionsWithBalance.reverse();
      
      // Adiciona as linhas da tabela
      transactionsWithBalance.forEach(transaction => {
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
        
        // Descrição
        doc.text(transaction.description || '-', 50 + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: 'left' });
        
        // Valor (com sinal positivo ou negativo)
        const valueText = `${transaction.isDebit ? '-' : '+'} ${transaction.amount.toFixed(2)} ${transaction.currency}`;
        doc.text(valueText, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3], align: 'right' });
        
        // Saldo
        doc.text(`${transaction.balance.toFixed(2)} ${transaction.currency}`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY, { width: columnWidths[4], align: 'right' });
        
        currentY += 20;
      });
      
      // Adiciona uma linha horizontal no final da tabela
      doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();
      
      // Adiciona o rodapé
      doc.fontSize(8).text(`Documento gerado em ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });
      
      // Finaliza o documento
      doc.end();
      
      // Espera o stream terminar
      stream.on('finish', () => {
        // Registra a atividade de geração de extrato em PDF
        LoggerService.logUserActivity(
          'generate_pdf_statement',
          req.user.id,
          {
            accountId,
            startDate,
            endDate,
            type,
            fileName
          }
        );
        
        // Envia o arquivo para download
        res.download(filePath, fileName, (err) => {
          if (err) {
            LoggerService.logSystemError(err, {
              context: 'StatementController.generatePdfStatement',
              accountId,
              filePath
            });
          }
          
          // Remove o arquivo temporário após o download
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              LoggerService.logSystemError(unlinkErr, {
                context: 'StatementController.generatePdfStatement.cleanup',
                filePath
              });
            }
          });
        });
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'StatementController.generatePdfStatement',
        accountId: req.params.accountId,
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao gerar extrato em PDF',
        error: error.message
      });
    }
  }

  /**
   * Obtém um resumo financeiro com saldos, transações recentes e estatísticas
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id;
      
      // Busca todas as contas do usuário
      const accounts = await Account.find({ userId });
      
      if (!accounts || accounts.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Nenhuma conta encontrada para este usuário'
        });
      }
      
      // Lista de IDs das contas para buscar transações
      const accountIds = accounts.map(account => account._id);
      
      // Busca as transações recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = await Transaction.find({
        $or: [
          { sourceAccountId: { $in: accountIds } },
          { destinationAccountId: { $in: accountIds } }
        ],
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 }).limit(10);
      
      // Calcula estatísticas por tipo de transação
      const transactionStats = await Transaction.aggregate([
        {
          $match: {
            $or: [
              { sourceAccountId: { $in: accountIds.map(id => mongoose.Types.ObjectId(id)) } },
              { destinationAccountId: { $in: accountIds.map(id => mongoose.Types.ObjectId(id)) } }
            ],
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);
      
      // Calcula o saldo total por moeda
      const balanceByCurrency = {};
      accounts.forEach(account => {
        if (!balanceByCurrency[account.currency]) {
          balanceByCurrency[account.currency] = 0;
        }
        balanceByCurrency[account.currency] += account.balance;
      });
      
      // Formata as transações recentes
      const formattedTransactions = recentTransactions.map(transaction => {
        const isDebit = accountIds.includes(transaction.sourceAccountId?.toString());
        
        return {
          id: transaction._id,
          date: transaction.createdAt,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          isDebit,
          status: transaction.status
        };
      });
      
      // Registra a atividade de visualização do resumo financeiro
      LoggerService.logUserActivity(
        'view_financial_summary',
        userId,
        { accountCount: accounts.length }
      );
      
      res.json({
        status: 'success',
        data: {
          accounts: accounts.map(account => ({
            id: account._id,
            number: account.accountNumber,
            type: account.type,
            currency: account.currency,
            balance: account.balance
          })),
          totalBalances: Object.entries(balanceByCurrency).map(([currency, balance]) => ({
            currency,
            balance
          })),
          recentTransactions: formattedTransactions,
          transactionStats
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'StatementController.getFinancialSummary',
        userId: req.user.id
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter resumo financeiro',
        error: error.message
      });
    }
  }
}

module.exports = new StatementController();
