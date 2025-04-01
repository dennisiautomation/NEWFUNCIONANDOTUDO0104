const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração de logs
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `validation_${new Date().toISOString().replace(/:/g, '-')}.log`);
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

// Validar usuários
async function validateUsers(MongoUser, pgdb) {
  try {
    log('Iniciando validação de usuários...');
    
    // Buscar todos os usuários do MongoDB
    const mongoUsers = await MongoUser.find({});
    log(`Total de usuários no MongoDB: ${mongoUsers.length}`);
    
    // Buscar todos os usuários do PostgreSQL
    const pgUsers = await pgdb.User.findAll();
    log(`Total de usuários no PostgreSQL: ${pgUsers.length}`);
    
    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;
    
    // Para cada usuário no MongoDB
    for (const mongoUser of mongoUsers) {
      // Buscar usuário correspondente no PostgreSQL
      const pgUser = pgUsers.find(u => u.email === mongoUser.email);
      
      if (!pgUser) {
        log(`Usuário não encontrado no PostgreSQL: ${mongoUser.email}`, 'warn');
        missingCount++;
        continue;
      }
      
      // Validar campos
      const isValid = 
        pgUser.name === mongoUser.name &&
        pgUser.email === mongoUser.email &&
        (pgUser.role === mongoUser.role || (!mongoUser.role && pgUser.role === 'client')) &&
        (pgUser.status === mongoUser.status || (!mongoUser.status && pgUser.status === 'active'));
      
      if (isValid) {
        validCount++;
      } else {
        log(`Usuário com dados inconsistentes: ${mongoUser.email}`, 'warn');
        invalidCount++;
      }
    }
    
    const totalMongoUsers = mongoUsers.length;
    const totalPgUsers = pgUsers.length;
    const coverage = totalMongoUsers > 0 ? (validCount / totalMongoUsers) * 100 : 0;
    
    log(`Validação de usuários concluída:`);
    log(`  MongoDB: ${totalMongoUsers} usuários`);
    log(`  PostgreSQL: ${totalPgUsers} usuários`);
    log(`  Válidos: ${validCount} (${coverage.toFixed(2)}%)`);
    log(`  Inválidos: ${invalidCount}`);
    log(`  Ausentes: ${missingCount}`);
    
    return {
      mongoCount: totalMongoUsers,
      pgCount: totalPgUsers,
      validCount,
      invalidCount,
      missingCount,
      coverage
    };
  } catch (error) {
    log(`Erro na validação de usuários: ${error.message}`, 'error');
    throw error;
  }
}

// Validar contas
async function validateAccounts(MongoAccount, MongoUser, pgdb) {
  try {
    log('Iniciando validação de contas...');
    
    // Buscar todas as contas do MongoDB
    const mongoAccounts = await MongoAccount.find({});
    log(`Total de contas no MongoDB: ${mongoAccounts.length}`);
    
    // Buscar todas as contas do PostgreSQL
    const pgAccounts = await pgdb.Account.findAll();
    log(`Total de contas no PostgreSQL: ${pgAccounts.length}`);
    
    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;
    
    // Para cada conta no MongoDB
    for (const mongoAccount of mongoAccounts) {
      // Buscar conta correspondente no PostgreSQL pelo número
      const pgAccount = pgAccounts.find(a => a.accountNumber === mongoAccount.accountNumber);
      
      if (!pgAccount) {
        log(`Conta não encontrada no PostgreSQL: ${mongoAccount.accountNumber}`, 'warn');
        missingCount++;
        continue;
      }
      
      // Buscar usuário MongoDB relacionado
      const mongoUser = await MongoUser.findById(mongoAccount.userId);
      
      if (!mongoUser) {
        log(`Usuário MongoDB não encontrado para conta: ${mongoAccount.accountNumber}`, 'warn');
        continue;
      }
      
      // Buscar usuário PostgreSQL correspondente
      const pgUser = await pgdb.User.findOne({
        where: { email: mongoUser.email }
      });
      
      if (!pgUser) {
        log(`Usuário PostgreSQL não encontrado para conta: ${mongoAccount.accountNumber}`, 'warn');
        continue;
      }
      
      // Validar campos
      const isValid = 
        pgAccount.accountNumber === mongoAccount.accountNumber &&
        pgAccount.userId === pgUser.id &&
        pgAccount.currency === mongoAccount.currency &&
        Math.abs(parseFloat(pgAccount.balance) - parseFloat(mongoAccount.balance)) < 0.001 &&
        (pgAccount.status === mongoAccount.status || (!mongoAccount.status && pgAccount.status === 'active'));
      
      if (isValid) {
        validCount++;
      } else {
        log(`Conta com dados inconsistentes: ${mongoAccount.accountNumber}`, 'warn');
        invalidCount++;
      }
    }
    
    const totalMongoAccounts = mongoAccounts.length;
    const totalPgAccounts = pgAccounts.length;
    const coverage = totalMongoAccounts > 0 ? (validCount / totalMongoAccounts) * 100 : 0;
    
    log(`Validação de contas concluída:`);
    log(`  MongoDB: ${totalMongoAccounts} contas`);
    log(`  PostgreSQL: ${totalPgAccounts} contas`);
    log(`  Válidas: ${validCount} (${coverage.toFixed(2)}%)`);
    log(`  Inválidas: ${invalidCount}`);
    log(`  Ausentes: ${missingCount}`);
    
    return {
      mongoCount: totalMongoAccounts,
      pgCount: totalPgAccounts,
      validCount,
      invalidCount,
      missingCount,
      coverage
    };
  } catch (error) {
    log(`Erro na validação de contas: ${error.message}`, 'error');
    throw error;
  }
}

// Validar transações
async function validateTransactions(MongoTransaction, MongoAccount, pgdb) {
  try {
    log('Iniciando validação de transações...');
    
    // Buscar todas as transações do MongoDB
    const mongoTransactions = await MongoTransaction.find({});
    log(`Total de transações no MongoDB: ${mongoTransactions.length}`);
    
    // Buscar todas as transações do PostgreSQL
    const pgTransactions = await pgdb.Transaction.findAll();
    log(`Total de transações no PostgreSQL: ${pgTransactions.length}`);
    
    // Mapa de números de conta para IDs no PostgreSQL
    const accountNumberToIdMap = new Map();
    const pgAccounts = await pgdb.Account.findAll();
    
    pgAccounts.forEach(account => {
      accountNumberToIdMap.set(account.accountNumber, account.id);
    });
    
    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;
    
    // Para cada transação no MongoDB
    for (const mongoTransaction of mongoTransactions) {
      try {
        // Buscar contas de origem e destino no MongoDB
        let sourceAccountNumber = null;
        let destAccountNumber = null;
        
        if (mongoTransaction.sourceAccountId) {
          const sourceAccount = await MongoAccount.findById(mongoTransaction.sourceAccountId);
          if (sourceAccount) {
            sourceAccountNumber = sourceAccount.accountNumber;
          }
        }
        
        if (mongoTransaction.destinationAccountId) {
          const destAccount = await MongoAccount.findById(mongoTransaction.destinationAccountId);
          if (destAccount) {
            destAccountNumber = destAccount.accountNumber;
          }
        }
        
        // Buscar correspondência no PostgreSQL
        // Como não temos um ID único para mapear diretamente, usamos uma combinação de fatores
        const matchingTransactions = pgTransactions.filter(t => 
          Math.abs(parseFloat(t.amount) - parseFloat(mongoTransaction.amount)) < 0.001 &&
          t.currency === mongoTransaction.currency &&
          t.transactionType === mongoTransaction.transactionType &&
          (sourceAccountNumber ? t.sourceAccountNumber === sourceAccountNumber : true) &&
          (destAccountNumber ? t.destinationAccountNumber === destAccountNumber : true) &&
          // Tolerância de tempo de 10 minutos
          Math.abs(new Date(t.createdAt) - new Date(mongoTransaction.createdAt)) < 600000
        );
        
        if (matchingTransactions.length === 0) {
          log(`Transação não encontrada no PostgreSQL: ${mongoTransaction._id}`, 'warn');
          missingCount++;
          continue;
        }
        
        // Se houver múltiplas correspondências, pegamos a mais próxima em tempo
        let pgTransaction = matchingTransactions[0];
        if (matchingTransactions.length > 1) {
          pgTransaction = matchingTransactions.reduce((closest, current) => {
            const closestDiff = Math.abs(new Date(closest.createdAt) - new Date(mongoTransaction.createdAt));
            const currentDiff = Math.abs(new Date(current.createdAt) - new Date(mongoTransaction.createdAt));
            return currentDiff < closestDiff ? current : closest;
          }, matchingTransactions[0]);
        }
        
        // Validar campos
        const isValid = 
          Math.abs(parseFloat(pgTransaction.amount) - parseFloat(mongoTransaction.amount)) < 0.001 &&
          pgTransaction.currency === mongoTransaction.currency &&
          pgTransaction.transactionType === mongoTransaction.transactionType &&
          (pgTransaction.status === mongoTransaction.status || (!mongoTransaction.status && pgTransaction.status === 'completed'));
        
        if (isValid) {
          validCount++;
        } else {
          log(`Transação com dados inconsistentes: ${mongoTransaction._id}`, 'warn');
          invalidCount++;
        }
      } catch (error) {
        log(`Erro ao validar transação ${mongoTransaction._id}: ${error.message}`, 'error');
        invalidCount++;
      }
    }
    
    const totalMongoTransactions = mongoTransactions.length;
    const totalPgTransactions = pgTransactions.length;
    const coverage = totalMongoTransactions > 0 ? (validCount / totalMongoTransactions) * 100 : 0;
    
    log(`Validação de transações concluída:`);
    log(`  MongoDB: ${totalMongoTransactions} transações`);
    log(`  PostgreSQL: ${totalPgTransactions} transações`);
    log(`  Válidas: ${validCount} (${coverage.toFixed(2)}%)`);
    log(`  Inválidas: ${invalidCount}`);
    log(`  Ausentes: ${missingCount}`);
    
    return {
      mongoCount: totalMongoTransactions,
      pgCount: totalPgTransactions,
      validCount,
      invalidCount,
      missingCount,
      coverage
    };
  } catch (error) {
    log(`Erro na validação de transações: ${error.message}`, 'error');
    throw error;
  }
}

// Validar saldos de contas
async function validateAccountBalances(MongoAccount, pgdb) {
  try {
    log('Iniciando validação de saldos de contas...');
    
    // Buscar todas as contas do MongoDB
    const mongoAccounts = await MongoAccount.find({});
    
    let validCount = 0;
    let invalidCount = 0;
    
    // Para cada conta no MongoDB
    for (const mongoAccount of mongoAccounts) {
      // Buscar conta correspondente no PostgreSQL
      const pgAccount = await pgdb.Account.findOne({
        where: { accountNumber: mongoAccount.accountNumber }
      });
      
      if (!pgAccount) {
        log(`Conta não encontrada no PostgreSQL: ${mongoAccount.accountNumber}`, 'warn');
        continue;
      }
      
      // Validar saldo
      const mongoBalance = parseFloat(mongoAccount.balance);
      const pgBalance = parseFloat(pgAccount.balance);
      
      // Consideramos válido se a diferença for menor que 0.01
      if (Math.abs(mongoBalance - pgBalance) < 0.01) {
        validCount++;
      } else {
        log(`Saldo inconsistente para conta ${mongoAccount.accountNumber}: MongoDB=${mongoBalance}, PostgreSQL=${pgBalance}`, 'warn');
        invalidCount++;
      }
    }
    
    const totalChecked = validCount + invalidCount;
    const percentValid = totalChecked > 0 ? (validCount / totalChecked) * 100 : 0;
    
    log(`Validação de saldos concluída:`);
    log(`  Contas verificadas: ${totalChecked}`);
    log(`  Saldos válidos: ${validCount} (${percentValid.toFixed(2)}%)`);
    log(`  Saldos inconsistentes: ${invalidCount}`);
    
    return {
      totalChecked,
      validCount,
      invalidCount,
      percentValid
    };
  } catch (error) {
    log(`Erro na validação de saldos: ${error.message}`, 'error');
    throw error;
  }
}

// Função principal para executar validação
async function validateAll() {
  let mongoConnection = null;
  let pgConnection = null;
  
  try {
    log('Iniciando processo de validação MongoDB -> PostgreSQL');
    
    // Conectar às bases de dados
    mongoConnection = await connectToMongoDB();
    pgConnection = await connectToPostgres();
    
    // Validar usuários
    const userResults = await validateUsers(
      mongoConnection.MongoUser, 
      pgConnection.pgdb
    );
    
    // Validar contas
    const accountResults = await validateAccounts(
      mongoConnection.MongoAccount,
      mongoConnection.MongoUser,
      pgConnection.pgdb
    );
    
    // Validar transações
    const transactionResults = await validateTransactions(
      mongoConnection.MongoTransaction,
      mongoConnection.MongoAccount,
      pgConnection.pgdb
    );
    
    // Validar saldos
    const balanceResults = await validateAccountBalances(
      mongoConnection.MongoAccount,
      pgConnection.pgdb
    );
    
    // Resumo da validação
    log('=== RESUMO DA VALIDAÇÃO ===');
    log(`Usuários: ${userResults.validCount}/${userResults.mongoCount} válidos (${userResults.coverage.toFixed(2)}% de cobertura)`);
    log(`Contas: ${accountResults.validCount}/${accountResults.mongoCount} válidas (${accountResults.coverage.toFixed(2)}% de cobertura)`);
    log(`Transações: ${transactionResults.validCount}/${transactionResults.mongoCount} válidas (${transactionResults.coverage.toFixed(2)}% de cobertura)`);
    log(`Saldos: ${balanceResults.validCount}/${balanceResults.totalChecked} válidos (${balanceResults.percentValid.toFixed(2)}%)`);
    
    // Avaliar sucesso geral da migração
    const overallUserCoverage = userResults.coverage;
    const overallAccountCoverage = accountResults.coverage;
    const overallTransactionCoverage = transactionResults.coverage;
    const overallBalanceValidity = balanceResults.percentValid;
    
    const overallScore = (overallUserCoverage + overallAccountCoverage + overallTransactionCoverage + overallBalanceValidity) / 4;
    
    log(`Pontuação geral da migração: ${overallScore.toFixed(2)}%`);
    
    if (overallScore >= 95) {
      log('Validação da migração: EXCELENTE', 'success');
    } else if (overallScore >= 90) {
      log('Validação da migração: MUITO BOA', 'success');
    } else if (overallScore >= 80) {
      log('Validação da migração: BOA', 'warn');
    } else if (overallScore >= 70) {
      log('Validação da migração: RAZOÁVEL', 'warn');
    } else {
      log('Validação da migração: INSATISFATÓRIA - Revisar e repetir processo', 'error');
    }
    
    // Fechar conexões
    await mongoose.disconnect();
    await pgConnection.sequelize.close();
    logStream.end();
    
    return {
      users: userResults,
      accounts: accountResults,
      transactions: transactionResults,
      balances: balanceResults,
      overallScore
    };
  } catch (error) {
    log(`Erro fatal no processo de validação: ${error.message}`, 'error');
    
    // Fechar conexões
    if (mongoConnection) await mongoose.disconnect();
    if (pgConnection) await pgConnection.sequelize.close();
    logStream.end();
    
    throw error;
  }
}

// Executar validação
if (require.main === module) {
  validateAll()
    .then(results => {
      process.exit(0);
    })
    .catch(error => {
      process.exit(1);
    });
} else {
  module.exports = {
    validateAll,
    validateUsers,
    validateAccounts,
    validateTransactions,
    validateAccountBalances
  };
}
