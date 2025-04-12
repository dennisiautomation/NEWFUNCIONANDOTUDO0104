/**
 * Controlador para gerenciar transferências entre contas de moedas diferentes
 */
const Transaction = require('../pg-models/transaction.model');
const User = require('../pg-models/user.model');
const Account = require('../pg-models/account.model');
const ExchangeRateService = require('../services/exchange-rate.service');
const LoggerService = require('../services/logger.service');

const logger = new LoggerService('CurrencyTransferController');

const CurrencyTransferController = {
  /**
   * Executar uma transferência entre contas de moedas diferentes
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async executeCurrencyTransfer(req, res) {
    try {
      const { fromAccountId, toAccountId, amount, description } = req.body;
      
      if (!fromAccountId || !toAccountId || !amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Dados incompletos para realizar a transferência'
        });
      }
      
      if (fromAccountId === toAccountId) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível transferir para a mesma conta'
        });
      }
      
      // Verificar se o valor é válido
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valor de transferência inválido'
        });
      }
      
      // Buscar conta de origem
      const sourceAccount = await Account.findByPk(fromAccountId);
      if (!sourceAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta de origem não encontrada'
        });
      }
      
      // Verificar se a conta pertence ao usuário
      if (sourceAccount.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Você não tem permissão para usar esta conta'
        });
      }
      
      // Verificar saldo
      if (sourceAccount.balance < transferAmount) {
        return res.status(400).json({
          status: 'error',
          message: 'Saldo insuficiente para realizar a transferência'
        });
      }
      
      // Buscar conta de destino
      const targetAccount = await Account.findByPk(toAccountId);
      if (!targetAccount) {
        return res.status(404).json({
          status: 'error',
          message: 'Conta de destino não encontrada'
        });
      }
      
      // Verificar se as moedas são diferentes
      const sourceCurrency = sourceAccount.currency;
      const targetCurrency = targetAccount.currency;
      
      let convertedAmount = transferAmount;
      let exchangeRate = 1;
      
      // Se as moedas forem diferentes, converter o valor
      if (sourceCurrency !== targetCurrency) {
        try {
          // Obter taxa de câmbio
          exchangeRate = await ExchangeRateService.getRate(sourceCurrency, targetCurrency);
          convertedAmount = await ExchangeRateService.convert(transferAmount, sourceCurrency, targetCurrency);
          
          logger.info(`Conversão: ${transferAmount} ${sourceCurrency} -> ${convertedAmount.toFixed(2)} ${targetCurrency} (taxa: ${exchangeRate})`);
        } catch (error) {
          logger.error(`Erro na conversão de moeda: ${error.message}`);
          return res.status(500).json({
            status: 'error',
            message: 'Erro ao converter moedas',
            error: error.message
          });
        }
      }
      
      // Iniciar transação no banco de dados
      const t = await sequelize.transaction();
      
      try {
        // Atualizar saldo da conta de origem
        await sourceAccount.update({ 
          balance: sequelize.literal(`balance - ${transferAmount}`) 
        }, { transaction: t });
        
        // Atualizar saldo da conta de destino
        await targetAccount.update({ 
          balance: sequelize.literal(`balance + ${convertedAmount}`) 
        }, { transaction: t });
        
        // Criar registro de transação para a conta de origem (saída)
        const sourceTransaction = await Transaction.create({
          type: 'TRANSFER_OUT',
          amount: -transferAmount,
          description: description || `Transferência para conta ${targetAccount.accountNumber} (${targetCurrency})`,
          status: 'COMPLETED',
          accountId: fromAccountId,
          userId: req.user.id,
          currency: sourceCurrency,
          targetAccountId: toAccountId,
          exchangeRate: exchangeRate,
          convertedAmount: convertedAmount,
          reference: `transfer-${Date.now()}`
        }, { transaction: t });
        
        // Criar registro de transação para a conta de destino (entrada)
        const targetTransaction = await Transaction.create({
          type: 'TRANSFER_IN',
          amount: convertedAmount,
          description: description || `Recebido de conta ${sourceAccount.accountNumber} (${sourceCurrency})`,
          status: 'COMPLETED',
          accountId: toAccountId,
          userId: targetAccount.userId,
          currency: targetCurrency,
          sourceAccountId: fromAccountId,
          exchangeRate: exchangeRate,
          originalAmount: transferAmount,
          reference: `transfer-${Date.now()}`
        }, { transaction: t });
        
        // Registrar atividade
        logger.logUserActivity({
          userId: req.user.id,
          action: 'CURRENCY_TRANSFER',
          details: `Transferência de ${transferAmount} ${sourceCurrency} para ${convertedAmount.toFixed(2)} ${targetCurrency}`,
          ipAddress: req.ip
        });
        
        // Confirmar transação no banco de dados
        await t.commit();
        
        return res.status(200).json({
          status: 'success',
          message: 'Transferência realizada com sucesso',
          data: {
            sourceTransaction,
            targetTransaction,
            fromAccount: {
              id: sourceAccount.id,
              accountNumber: sourceAccount.accountNumber,
              currency: sourceAccount.currency,
              newBalance: sourceAccount.balance - transferAmount
            },
            toAccount: {
              id: targetAccount.id,
              accountNumber: targetAccount.accountNumber,
              currency: targetAccount.currency,
              newBalance: targetAccount.balance + convertedAmount
            },
            transferAmount,
            convertedAmount,
            exchangeRate
          }
        });
      } catch (error) {
        // Reverter transação em caso de erro
        await t.rollback();
        
        logger.error(`Erro ao processar transferência: ${error.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Erro ao processar transferência',
          error: error.message
        });
      }
    } catch (error) {
      logger.error(`Erro geral na transferência: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao processar transferência',
        error: error.message
      });
    }
  },
  
  /**
   * Obter taxa de câmbio entre duas moedas
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getExchangeRate(req, res) {
    try {
      const { fromCurrency, toCurrency } = req.params;
      
      if (!fromCurrency || !toCurrency) {
        return res.status(400).json({
          status: 'error',
          message: 'É necessário especificar as moedas de origem e destino'
        });
      }
      
      // Obter taxa de câmbio
      const rate = await ExchangeRateService.getRate(fromCurrency, toCurrency);
      
      return res.status(200).json({
        status: 'success',
        data: {
          fromCurrency,
          toCurrency,
          rate,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error(`Erro ao obter taxa de câmbio: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao obter taxa de câmbio',
        error: error.message
      });
    }
  },
  
  /**
   * Simular conversão entre moedas
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async simulateConversion(req, res) {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          status: 'error',
          message: 'Dados incompletos para simulação'
        });
      }
      
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valor inválido para conversão'
        });
      }
      
      // Obter taxa de câmbio
      const rate = await ExchangeRateService.getRate(fromCurrency, toCurrency);
      
      // Converter valor
      const convertedAmount = await ExchangeRateService.convert(transferAmount, fromCurrency, toCurrency);
      
      return res.status(200).json({
        status: 'success',
        data: {
          originalAmount: transferAmount,
          originalCurrency: fromCurrency,
          convertedAmount,
          targetCurrency: toCurrency,
          exchangeRate: rate,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error(`Erro ao simular conversão: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao simular conversão',
        error: error.message
      });
    }
  }
};

module.exports = CurrencyTransferController;
