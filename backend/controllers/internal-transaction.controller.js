const { sequelize, Account, Transaction } = require('../pg-models');

// Realizar um depósito em uma conta interna
exports.deposit = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountId, amount, description, reference } = req.body;
    
    if (!accountId || !amount || parseFloat(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta e valor válido são obrigatórios'
      });
    }
    
    // Buscar a conta
    const account = await Account.findOne({
      where: { 
        id: accountId,
        isInternal: true,
        status: 'active'
      },
      transaction: t
    });
    
    if (!account) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Conta interna não encontrada ou inativa'
      });
    }
    
    // Registrar a transação
    const transaction = await Transaction.create({
      transactionType: 'deposit',
      amount,
      currency: account.currency,
      destinationAccountId: account.id,
      status: 'pending',
      description: description || 'Depósito',
      reference: reference || `DEP-${Date.now()}`,
    }, { transaction: t });
    
    // Atualizar o saldo da conta
    account.balance = parseFloat(account.balance) + parseFloat(amount);
    await account.save({ transaction: t });
    
    // Marcar a transação como concluída
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    await transaction.save({ transaction: t });
    
    await t.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Depósito realizado com sucesso',
      data: {
        transactionId: transaction.id,
        accountId: account.id,
        accountNumber: account.accountNumber,
        amount,
        currency: account.currency,
        newBalance: account.balance,
        date: transaction.createdAt
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Erro ao realizar depósito:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao realizar depósito',
      error: error.message
    });
  }
};

// Realizar um saque de uma conta interna
exports.withdraw = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { accountId, amount, description, reference } = req.body;
    
    if (!accountId || !amount || parseFloat(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta e valor válido são obrigatórios'
      });
    }
    
    // Buscar a conta
    const account = await Account.findOne({
      where: { 
        id: accountId,
        isInternal: true,
        status: 'active'
      },
      transaction: t
    });
    
    if (!account) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Conta interna não encontrada ou inativa'
      });
    }
    
    // Verificar se há saldo suficiente
    if (parseFloat(account.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Saldo insuficiente'
      });
    }
    
    // Registrar a transação
    const transaction = await Transaction.create({
      transactionType: 'withdrawal',
      amount,
      currency: account.currency,
      sourceAccountId: account.id,
      status: 'pending',
      description: description || 'Saque',
      reference: reference || `WD-${Date.now()}`,
    }, { transaction: t });
    
    // Atualizar o saldo da conta
    account.balance = parseFloat(account.balance) - parseFloat(amount);
    await account.save({ transaction: t });
    
    // Marcar a transação como concluída
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    await transaction.save({ transaction: t });
    
    // Confirmar a transação
    await t.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Saque realizado com sucesso',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.transactionType,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference
        },
        account: {
          id: account.id,
          balance: account.balance
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Erro ao realizar saque:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao realizar saque',
      error: error.message
    });
  }
};

// Realizar uma transferência entre contas internas
exports.transfer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { sourceAccountId, destinationAccountId, amount, description, reference } = req.body;
    
    if (!sourceAccountId || !destinationAccountId || !amount || parseFloat(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'IDs das contas e valor válido são obrigatórios'
      });
    }
    
    // Verificar se as contas são diferentes
    if (sourceAccountId === destinationAccountId) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível transferir para a mesma conta'
      });
    }
    
    // Buscar a conta de origem
    const sourceAccount = await Account.findOne({
      where: { 
        id: sourceAccountId,
        isInternal: true,
        status: 'active'
      },
      transaction: t
    });
    
    if (!sourceAccount) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Conta de origem não encontrada ou inativa'
      });
    }
    
    // Verificar se há saldo suficiente
    if (parseFloat(sourceAccount.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Saldo insuficiente'
      });
    }
    
    // Verificar limites de transferência (diário e mensal)
    if (!sourceAccount.checkDailyLimit(amount)) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: `Limite diário excedido. Limite: ${sourceAccount.dailyTransferLimit}, Usado: ${sourceAccount.dailyTransferTotal}`,
        data: {
          limit: sourceAccount.dailyTransferLimit,
          used: sourceAccount.dailyTransferTotal,
          available: sourceAccount.dailyTransferLimit - sourceAccount.dailyTransferTotal
        }
      });
    }
    
    if (!sourceAccount.checkMonthlyLimit(amount)) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: `Limite mensal excedido. Limite: ${sourceAccount.monthlyTransferLimit}, Usado: ${sourceAccount.monthlyTransferTotal}`,
        data: {
          limit: sourceAccount.monthlyTransferLimit,
          used: sourceAccount.monthlyTransferTotal,
          available: sourceAccount.monthlyTransferLimit - sourceAccount.monthlyTransferTotal
        }
      });
    }
    
    // Buscar a conta de destino
    const destinationAccount = await Account.findOne({
      where: { 
        id: destinationAccountId,
        isInternal: true,
        status: 'active'
      },
      transaction: t
    });
    
    if (!destinationAccount) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Conta de destino não encontrada ou inativa'
      });
    }
    
    // Verificar se as moedas são compatíveis
    if (sourceAccount.currency !== destinationAccount.currency) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Transferência entre moedas diferentes não permitida'
      });
    }
    
    // Registrar a transação
    const transaction = await Transaction.create({
      transactionType: 'transfer',
      amount,
      currency: sourceAccount.currency,
      sourceAccountId: sourceAccount.id,
      destinationAccountId: destinationAccount.id,
      status: 'pending',
      description: description || `Transferência para ${destinationAccount.accountNumber}`,
      reference: reference || `TRF-${Date.now()}`,
    }, { transaction: t });
    
    // Atualizar o saldo da conta de origem
    sourceAccount.balance = parseFloat(sourceAccount.balance) - parseFloat(amount);
    await sourceAccount.save({ transaction: t });
    
    // Atualizar totais de transferência
    await sourceAccount.updateTransferTotals(parseFloat(amount));
    
    // Atualizar o saldo da conta de destino
    destinationAccount.balance = parseFloat(destinationAccount.balance) + parseFloat(amount);
    await destinationAccount.save({ transaction: t });
    
    // Marcar a transação como concluída
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    await transaction.save({ transaction: t });
    
    // Confirmar a transação
    await t.commit();
    
    return res.status(200).json({
      status: 'success',
      message: 'Transferência realizada com sucesso',
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.transactionType,
          amount: transaction.amount,
          status: transaction.status,
          reference: transaction.reference
        },
        sourceAccount: {
          id: sourceAccount.id,
          balance: sourceAccount.balance
        },
        destinationAccount: {
          id: destinationAccount.id,
          balance: destinationAccount.balance
        }
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Erro ao realizar transferência:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao realizar transferência',
      error: error.message
    });
  }
};

// Obter extrato de transações de uma conta
exports.getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Verificar se a conta existe
    const account = await Account.findOne({
      where: { 
        id: accountId,
        isInternal: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta interna não encontrada'
      });
    }
    
    // Buscar as transações
    const transactions = await Transaction.findAll({
      where: {
        [sequelize.Op.or]: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId }
        ]
      },
      include: [
        {
          model: Account,
          as: 'sourceAccount',
          attributes: ['id', 'accountNumber', 'accountType', 'userId']
        },
        {
          model: Account,
          as: 'destinationAccount',
          attributes: ['id', 'accountNumber', 'accountType', 'userId']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Extrato obtido com sucesso',
      data: {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        transactions: transactions.map(transaction => {
          // Para calcular se é entrada ou saída na perspectiva desta conta
          const isOutgoing = transaction.sourceAccountId === parseInt(accountId);
          
          return {
            id: transaction.id,
            date: transaction.createdAt,
            type: transaction.transactionType,
            amount: transaction.amount,
            currency: transaction.currency,
            isOutgoing,
            balance: isOutgoing ? `-${transaction.amount}` : `+${transaction.amount}`,
            status: transaction.status,
            description: transaction.description,
            reference: transaction.reference,
            counterparty: isOutgoing 
              ? (transaction.destinationAccount ? transaction.destinationAccount.accountNumber : 'N/A')
              : (transaction.sourceAccount ? transaction.sourceAccount.accountNumber : 'N/A')
          };
        })
      }
    });
  } catch (error) {
    console.error('Erro ao obter extrato:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao obter extrato',
      error: error.message
    });
  }
};
