const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionType: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'transfer', 'receive'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency: {
    type: DataTypes.ENUM('USD', 'EUR', 'USDT'),
    allowNull: false
  },
  sourceAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Accounts',
      key: 'id'
    }
  },
  destinationAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Accounts',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt
});

// Método para marcar a transação como concluída
Transaction.prototype.markCompleted = async function() {
  this.status = 'completed';
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Método para marcar a transação como falha
Transaction.prototype.markFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Método para cancelar a transação
Transaction.prototype.cancel = async function() {
  this.status = 'cancelled';
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Método estático para buscar transações de uma conta
Transaction.findAccountTransactions = async function(accountId, limit = 50, offset = 0) {
  return await this.findAll({
    where: {
      [sequelize.Op.or]: [
        { sourceAccountId: accountId },
        { destinationAccountId: accountId }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

module.exports = Transaction;
