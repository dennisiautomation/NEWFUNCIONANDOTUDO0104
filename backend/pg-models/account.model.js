const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  accountType: {
    type: DataTypes.ENUM('standard', 'savings', 'internal', 'business'),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['USD', 'EUR', 'USDT', 'BRL']]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  balance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'closed'),
    defaultValue: 'active'
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Flag para identificar contas internas (sem FT)'
  },
  dailyTransferLimit: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 10000
  },
  monthlyTransferLimit: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 50000
  },
  dailyTransferTotal: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  monthlyTransferTotal: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  lastTransferDate: {
    type: DataTypes.DATE
  },
  lastMonthReset: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (account) => {
      if (!account.accountNumber) {
        account.accountNumber = await Account.generateAccountNumber(account.accountType);
      }
    }
  }
});

// Método para verificar se uma transferência está dentro do limite diário
Account.prototype.checkDailyLimit = function(amount) {
  return (this.dailyTransferTotal + amount) <= this.dailyTransferLimit;
};

// Método para verificar se uma transferência está dentro do limite mensal
Account.prototype.checkMonthlyLimit = function(amount) {
  return (this.monthlyTransferTotal + amount) <= this.monthlyTransferLimit;
};

// Método para atualizar os totais de transferência após uma transação bem-sucedida
Account.prototype.updateTransferTotals = async function(amount) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Verificar se precisa resetar o limite diário
  if (!this.lastTransferDate || new Date(this.lastTransferDate) < today) {
    this.dailyTransferTotal = 0;
  }
  
  // Verificar se precisa resetar o limite mensal
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!this.lastMonthReset || new Date(this.lastMonthReset) < thisMonth) {
    this.monthlyTransferTotal = 0;
    this.lastMonthReset = now;
  }
  
  // Atualizar totais
  this.dailyTransferTotal += amount;
  this.monthlyTransferTotal += amount;
  this.lastTransferDate = now;
  
  await this.save();
};

// Método estático para gerar um número de conta único
Account.generateAccountNumber = async function(accountType) {
  const prefix = {
    'standard': '1000',
    'savings': '2000',
    'internal': '3000',
    'business': '4000'
  }[accountType] || '9000';
  
  const count = await this.count() + 1;
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const accountNumber = `${prefix}${count.toString().padStart(6, '0')}${randomDigits}`;
  
  return accountNumber;
};

module.exports = Account;
