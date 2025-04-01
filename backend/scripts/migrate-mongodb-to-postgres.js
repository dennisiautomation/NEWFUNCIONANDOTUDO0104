const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração de logs
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `migration_${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Função auxiliar para logs
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Conexão com MongoDB
async function connectToMongoDB() {
  try {
    log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('Conectado ao MongoDB com sucesso');
    
    // Definir modelos do MongoDB
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      documentType: String,
      documentNumber: String,
      status: String,
      createdAt: Date,
      updatedAt: Date
    });
    
    const accountSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      accountNumber: String,
      accountType: String,
      name: String,
      currency: String,
      balance: Number,
      status: String,
      createdAt: Date,
      updatedAt: Date
    });
    
    const transactionSchema = new mongoose.Schema({
      sourceAccountId: mongoose.Schema.Types.ObjectId,
      destinationAccountId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      currency: String,
      transactionType: String,
      status: String,
      description: String,
      metadata: Object,
      createdAt: Date,
      updatedAt: Date
    });
    
    // Registrar modelos
    const MongoUser = mongoose.model('User', userSchema);
    const MongoAccount = mongoose.model('Account', accountSchema);
    const MongoTransaction = mongoose.model('Transaction', transactionSchema);
    
    return { MongoUser, MongoAccount, MongoTransaction };
  } catch (error) {
    log(`Erro ao conectar ao MongoDB: ${error.message}`, 'error');
    throw error;
  }
}

// Conexão com PostgreSQL
async function connectToPostgres() {
  try {
    log('Conectando ao PostgreSQL...');
    
    const sequelize = new Sequelize(
      process.env.PG_DATABASE,
      process.env.PG_USER,
      process.env.PG_PASSWORD,
      {
        host: process.env.PG_HOST,
        dialect: 'postgres',
        logging: false
      }
    );
    
    await sequelize.authenticate();
    log('Conectado ao PostgreSQL com sucesso');
    
    // Carregar modelos do PostgreSQL
    const pgdb = require('../pg-models');
    
    return { sequelize, pgdb };
  } catch (error) {
    log(`Erro ao conectar ao PostgreSQL: ${error.message}`, 'error');
    throw error;
  }
}

// Migrar usuários
async function migrateUsers(MongoUser, pgdb) {
  try {
    log('Iniciando migração de usuários...');
    
    // Buscar todos os usuários do MongoDB
    const mongoUsers = await MongoUser.find({});
    log(`Total de usuários no MongoDB: ${mongoUsers.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Para cada usuário no MongoDB
    for (const mongoUser of mongoUsers) {
      try {
        // Verificar se o usuário já existe no PostgreSQL
        const existingUser = await pgdb.User.findOne({
          where: { email: mongoUser.email }
        });
        
        if (existingUser) {
          log(`Usuário já existe no PostgreSQL: ${mongoUser.email}`, 'warn');
          continue;
        }
        
        // Criar usuário no PostgreSQL
        const pgUser = await pgdb.User.create({
          id: uuidv4(), // Gerar novo UUID
          name: mongoUser.name,
          email: mongoUser.email,
          password: mongoUser.password, // Já está hasheado no MongoDB
          role: mongoUser.role || 'client',
          documentType: mongoUser.documentType || 'cpf',
          documentNumber: mongoUser.documentNumber || '00000000000',
          status: mongoUser.status || 'active',
          createdAt: mongoUser.createdAt || new Date(),
          updatedAt: mongoUser.updatedAt || new Date()
        });
        
        log(`Usuário migrado com sucesso: ${mongoUser.email}`);
        successCount++;
      } catch (error) {
        log(`Erro ao migrar usuário ${mongoUser.email}: ${error.message}`, 'error');
        errorCount++;
      }
    }
    
    log(`Migração de usuários concluída. Sucesso: ${successCount}, Erros: ${errorCount}`);
    return { successCount, errorCount };
  } catch (error) {
    log(`Erro geral na migração de usuários: ${error.message}`, 'error');
    throw error;
  }
}

// Migrar contas
async function migrateAccounts(MongoAccount, MongoUser, pgdb) {
  try {
    log('Iniciando migração de contas...');
    
    // Buscar todas as contas do MongoDB
    const mongoAccounts = await MongoAccount.find({});
    log(`Total de contas no MongoDB: ${mongoAccounts.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Para cada conta no MongoDB
    for (const mongoAccount of mongoAccounts) {
      try {
        // Buscar usuário MongoDB relacionado
        const mongoUser = await MongoUser.findById(mongoAccount.userId);
        
        if (!mongoUser) {
          log(`Usuário não encontrado para a conta: ${mongoAccount.accountNumber}`, 'warn');
          continue;
        }
        
        // Buscar usuário PostgreSQL correspondente
        const pgUser = await pgdb.User.findOne({
          where: { email: mongoUser.email }
        });
        
        if (!pgUser) {
          log(`Usuário PostgreSQL não encontrado para: ${mongoUser.email}`, 'warn');
          continue;
        }
        
        // Verificar se a conta já existe no PostgreSQL
        const existingAccount = await pgdb.Account.findOne({
          where: { accountNumber: mongoAccount.accountNumber }
        });
        
        if (existingAccount) {
          log(`Conta já existe no PostgreSQL: ${mongoAccount.accountNumber}`, 'warn');
          continue;
        }
        
        // Criar conta no PostgreSQL
        const pgAccount = await pgdb.Account.create({
          id: uuidv4(), // Gerar novo UUID
          userId: pgUser.id,
          accountNumber: mongoAccount.accountNumber,
          accountType: mongoAccount.accountType || 'internal',
          name: mongoAccount.name || `${mongoAccount.currency} Account`,
          currency: mongoAccount.currency,
          balance: mongoAccount.balance || 0,
          status: mongoAccount.status || 'active',
          dailyTransferLimit: 10000, // Valores padrão para limites
          monthlyTransferLimit: 100000,
          dailyTransferTotal: 0,
          monthlyTransferTotal: 0,
          createdAt: mongoAccount.createdAt || new Date(),
          updatedAt: mongoAccount.updatedAt || new Date()
        });
        
        log(`Conta migrada com sucesso: ${mongoAccount.accountNumber}`);
        successCount++;
      } catch (error) {
        log(`Erro ao migrar conta ${mongoAccount.accountNumber}: ${error.message}`, 'error');
        errorCount++;
      }
    }
    
    log(`Migração de contas concluída. Sucesso: ${successCount}, Erros: ${errorCount}`);
    return { successCount, errorCount };
  } catch (error) {
    log(`Erro geral na migração de contas: ${error.message}`, 'error');
    throw error;
  }
}

// Migrar transações
async function migrateTransactions(MongoTransaction, MongoAccount, pgdb) {
  try {
    log('Iniciando migração de transações...');
    
    // Buscar todas as transações do MongoDB
    const mongoTransactions = await MongoTransaction.find({});
    log(`Total de transações no MongoDB: ${mongoTransactions.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Para cada transação no MongoDB
    for (const mongoTransaction of mongoTransactions) {
      try {
        // Buscar contas de origem e destino no MongoDB
        const sourceMongoAccount = mongoTransaction.sourceAccountId ? 
          await MongoAccount.findById(mongoTransaction.sourceAccountId) : null;
        
        const destMongoAccount = mongoTransaction.destinationAccountId ? 
          await MongoAccount.findById(mongoTransaction.destinationAccountId) : null;
        
        // Verificar se as contas existem no PostgreSQL
        let pgSourceAccount = null;
        let pgDestAccount = null;
        
        if (sourceMongoAccount) {
          pgSourceAccount = await pgdb.Account.findOne({
            where: { accountNumber: sourceMongoAccount.accountNumber }
          });
        }
        
        if (destMongoAccount) {
          pgDestAccount = await pgdb.Account.findOne({
            where: { accountNumber: destMongoAccount.accountNumber }
          });
        }
        
        // Se for uma transferência, precisamos das duas contas
        if (mongoTransaction.transactionType === 'transfer' && (!pgSourceAccount || !pgDestAccount)) {
          log(`Contas não encontradas para transferência: ${mongoTransaction._id}`, 'warn');
          continue;
        }
        
        // Se for um depósito, precisamos da conta de destino
        if (mongoTransaction.transactionType === 'deposit' && !pgDestAccount) {
          log(`Conta de destino não encontrada para depósito: ${mongoTransaction._id}`, 'warn');
          continue;
        }
        
        // Se for um saque, precisamos da conta de origem
        if (mongoTransaction.transactionType === 'withdrawal' && !pgSourceAccount) {
          log(`Conta de origem não encontrada para saque: ${mongoTransaction._id}`, 'warn');
          continue;
        }
        
        // Criar transação no PostgreSQL
        const pgTransaction = await pgdb.Transaction.create({
          id: uuidv4(), // Gerar novo UUID
          sourceAccountId: pgSourceAccount ? pgSourceAccount.id : null,
          destinationAccountId: pgDestAccount ? pgDestAccount.id : null,
          sourceAccountNumber: pgSourceAccount ? pgSourceAccount.accountNumber : null,
          destinationAccountNumber: pgDestAccount ? pgDestAccount.accountNumber : null,
          amount: mongoTransaction.amount,
          currency: mongoTransaction.currency,
          transactionType: mongoTransaction.transactionType,
          status: mongoTransaction.status || 'completed',
          description: mongoTransaction.description || '',
          metadata: mongoTransaction.metadata || {},
          createdAt: mongoTransaction.createdAt || new Date(),
          updatedAt: mongoTransaction.updatedAt || new Date()
        });
        
        log(`Transação migrada com sucesso: ${mongoTransaction._id}`);
        successCount++;
      } catch (error) {
        log(`Erro ao migrar transação ${mongoTransaction._id}: ${error.message}`, 'error');
        errorCount++;
      }
    }
    
    log(`Migração de transações concluída. Sucesso: ${successCount}, Erros: ${errorCount}`);
    return { successCount, errorCount };
  } catch (error) {
    log(`Erro geral na migração de transações: ${error.message}`, 'error');
    throw error;
  }
}

// Função principal para executar migração
async function migrateAll() {
  let mongoConnection = null;
  let pgConnection = null;
  
  try {
    log('Iniciando processo de migração MongoDB -> PostgreSQL');
    
    // Conectar às bases de dados
    mongoConnection = await connectToMongoDB();
    pgConnection = await connectToPostgres();
    
    // Migrar usuários
    const userResults = await migrateUsers(
      mongoConnection.MongoUser, 
      pgConnection.pgdb
    );
    
    // Migrar contas
    const accountResults = await migrateAccounts(
      mongoConnection.MongoAccount,
      mongoConnection.MongoUser,
      pgConnection.pgdb
    );
    
    // Migrar transações
    const transactionResults = await migrateTransactions(
      mongoConnection.MongoTransaction,
      mongoConnection.MongoAccount,
      pgConnection.pgdb
    );
    
    // Resumo da migração
    log('=== RESUMO DA MIGRAÇÃO ===');
    log(`Usuários: ${userResults.successCount} migrados, ${userResults.errorCount} erros`);
    log(`Contas: ${accountResults.successCount} migradas, ${accountResults.errorCount} erros`);
    log(`Transações: ${transactionResults.successCount} migradas, ${transactionResults.errorCount} erros`);
    log('Migração concluída!');
    
    // Fechar conexões
    await mongoose.disconnect();
    await pgConnection.sequelize.close();
    logStream.end();
    
    return {
      users: userResults,
      accounts: accountResults,
      transactions: transactionResults
    };
  } catch (error) {
    log(`Erro fatal no processo de migração: ${error.message}`, 'error');
    
    // Fechar conexões
    if (mongoConnection) await mongoose.disconnect();
    if (pgConnection) await pgConnection.sequelize.close();
    logStream.end();
    
    throw error;
  }
}

// Executar migração
if (require.main === module) {
  migrateAll()
    .then(results => {
      process.exit(0);
    })
    .catch(error => {
      process.exit(1);
    });
} else {
  module.exports = {
    migrateAll,
    migrateUsers,
    migrateAccounts,
    migrateTransactions
  };
}
