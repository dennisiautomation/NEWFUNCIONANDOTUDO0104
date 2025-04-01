const { sequelize } = require('../config/database');
const User = require('./user.model');
const Account = require('./account.model');
const Transaction = require('./transaction.model');

// Definir as associações entre os modelos
User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Associações para transações
Account.hasMany(Transaction, { foreignKey: 'sourceAccountId', as: 'outgoingTransactions' });
Account.hasMany(Transaction, { foreignKey: 'destinationAccountId', as: 'incomingTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'sourceAccountId', as: 'sourceAccount' });
Transaction.belongsTo(Account, { foreignKey: 'destinationAccountId', as: 'destinationAccount' });

// Função para sincronizar todos os modelos com o banco de dados
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Modelos sincronizados com o PostgreSQL com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar modelos:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Account,
  Transaction,
  syncModels
};
