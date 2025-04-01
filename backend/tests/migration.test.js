const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { v4: uuidv4 } = require('uuid');

// Módulos a serem testados
const migrationModule = require('../scripts/migrate-mongodb-to-postgres');
const validationModule = require('../scripts/validate-migration');

describe('Testes de Migração MongoDB para PostgreSQL', function() {
  // Tempo limite maior para testes de migração
  this.timeout(20000);
  
  let mongoServer;
  let mongoUri;
  let mongoConnection;
  let sequelize;
  let pgModels;
  
  // Configuração do ambiente de teste
  before(async function() {
    // Iniciar MongoDB em memória para testes
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    // Substituir a URI do MongoDB no ambiente
    process.env.MONGODB_URI = mongoUri;
    
    // Iniciar PostgreSQL em memória
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // Mock dos modelos do PostgreSQL
    pgModels = {
      User: sequelize.define('User', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.STRING,
        role: Sequelize.STRING,
        documentType: Sequelize.STRING,
        documentNumber: Sequelize.STRING,
        status: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }),
      Account: sequelize.define('Account', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        userId: Sequelize.STRING,
        accountNumber: Sequelize.STRING,
        accountType: Sequelize.STRING,
        name: Sequelize.STRING,
        currency: Sequelize.STRING,
        balance: Sequelize.DECIMAL(18, 2),
        status: Sequelize.STRING,
        dailyTransferLimit: Sequelize.DECIMAL(18, 2),
        monthlyTransferLimit: Sequelize.DECIMAL(18, 2),
        dailyTransferTotal: Sequelize.DECIMAL(18, 2),
        monthlyTransferTotal: Sequelize.DECIMAL(18, 2),
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }),
      Transaction: sequelize.define('Transaction', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        sourceAccountId: Sequelize.STRING,
        destinationAccountId: Sequelize.STRING,
        sourceAccountNumber: Sequelize.STRING,
        destinationAccountNumber: Sequelize.STRING,
        amount: Sequelize.DECIMAL(18, 2),
        currency: Sequelize.STRING,
        transactionType: Sequelize.STRING,
        status: Sequelize.STRING,
        description: Sequelize.STRING,
        metadata: Sequelize.JSON,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      })
    };
    
    // Configurar relações
    pgModels.User.hasMany(pgModels.Account, { foreignKey: 'userId' });
    pgModels.Account.belongsTo(pgModels.User, { foreignKey: 'userId' });
    
    pgModels.Account.hasMany(pgModels.Transaction, { foreignKey: 'sourceAccountId', as: 'outgoingTransactions' });
    pgModels.Transaction.belongsTo(pgModels.Account, { foreignKey: 'sourceAccountId', as: 'sourceAccount' });
    
    pgModels.Account.hasMany(pgModels.Transaction, { foreignKey: 'destinationAccountId', as: 'incomingTransactions' });
    pgModels.Transaction.belongsTo(pgModels.Account, { foreignKey: 'destinationAccountId', as: 'destinationAccount' });
    
    // Sincronizar os modelos com o banco de dados
    await sequelize.sync({ force: true });
    
    // Mock do módulo pg-models
    const pgModelsMock = {
      ...pgModels,
      sequelize
    };
    
    // Substituir imports do módulo pg-models
    sinon.stub(require('module'), '_load').callsFake(function(modulePath) {
      if (modulePath === '../pg-models') {
        return pgModelsMock;
      }
      return require.requireActual(modulePath);
    });
    
    // Conectar ao MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Definir modelos do MongoDB para testes
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
    mongoose.model('User', userSchema);
    mongoose.model('Account', accountSchema);
    mongoose.model('Transaction', transactionSchema);
    
    mongoConnection = {
      MongoUser: mongoose.model('User'),
      MongoAccount: mongoose.model('Account'),
      MongoTransaction: mongoose.model('Transaction')
    };
  });
  
  // Limpar ambiente após os testes
  after(async function() {
    await mongoose.disconnect();
    await sequelize.close();
    await mongoServer.stop();
    sinon.restore();
  });
  
  // Limpar dados entre os testes
  beforeEach(async function() {
    // Limpar MongoDB
    await mongoConnection.MongoUser.deleteMany({});
    await mongoConnection.MongoAccount.deleteMany({});
    await mongoConnection.MongoTransaction.deleteMany({});
    
    // Limpar PostgreSQL
    await pgModels.Transaction.destroy({ where: {} });
    await pgModels.Account.destroy({ where: {} });
    await pgModels.User.destroy({ where: {} });
  });
  
  // Testes de Migração de Usuários
  describe('Migração de Usuários', function() {
    it('deve migrar usuários do MongoDB para PostgreSQL', async function() {
      // Criar alguns usuários de teste no MongoDB
      const testUsers = [
        {
          name: 'Usuário Teste 1',
          email: 'usuario1@test.com',
          password: 'hashedpassword1',
          role: 'client',
          documentType: 'cpf',
          documentNumber: '12345678901',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Usuário Teste 2',
          email: 'usuario2@test.com',
          password: 'hashedpassword2',
          role: 'admin',
          documentType: 'cnpj',
          documentNumber: '12345678901234',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await mongoConnection.MongoUser.insertMany(testUsers);
      
      // Executar migração de usuários
      const results = await migrationModule.migrateUsers(
        mongoConnection.MongoUser, 
        pgModels
      );
      
      // Verificar resultados
      expect(results.successCount).to.equal(2);
      expect(results.errorCount).to.equal(0);
      
      // Verificar se os usuários foram migrados corretamente
      const pgUsers = await pgModels.User.findAll();
      expect(pgUsers.length).to.equal(2);
      
      // Verificar dados do primeiro usuário
      const user1 = pgUsers.find(u => u.email === 'usuario1@test.com');
      expect(user1).to.exist;
      expect(user1.name).to.equal('Usuário Teste 1');
      expect(user1.role).to.equal('client');
      expect(user1.documentType).to.equal('cpf');
      
      // Verificar dados do segundo usuário
      const user2 = pgUsers.find(u => u.email === 'usuario2@test.com');
      expect(user2).to.exist;
      expect(user2.name).to.equal('Usuário Teste 2');
      expect(user2.role).to.equal('admin');
      expect(user2.documentType).to.equal('cnpj');
    });
    
    it('deve lidar com duplicatas de email durante a migração', async function() {
      // Criar um usuário de teste no MongoDB
      const testUser = {
        name: 'Usuário Duplicado',
        email: 'duplicado@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoConnection.MongoUser.create(testUser);
      
      // Criar o mesmo usuário no PostgreSQL
      await pgModels.User.create({
        id: uuidv4(),
        name: 'Usuário Já Existente',
        email: 'duplicado@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Executar migração de usuários
      const results = await migrationModule.migrateUsers(
        mongoConnection.MongoUser, 
        pgModels
      );
      
      // Verificar resultados - não deve tentar criar o usuário duplicado
      expect(results.successCount).to.equal(0);
      
      // Verificar se apenas um usuário existe no PostgreSQL
      const pgUsers = await pgModels.User.findAll();
      expect(pgUsers.length).to.equal(1);
    });
  });
  
  // Testes de Migração de Contas
  describe('Migração de Contas', function() {
    it('deve migrar contas do MongoDB para PostgreSQL', async function() {
      // Criar um usuário de teste no MongoDB
      const mongoUser = await mongoConnection.MongoUser.create({
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Criar contas de teste no MongoDB
      const testAccounts = [
        {
          userId: mongoUser._id,
          accountNumber: 'ACC001',
          accountType: 'internal',
          name: 'Conta USD',
          currency: 'USD',
          balance: 1000,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: mongoUser._id,
          accountNumber: 'ACC002',
          accountType: 'internal',
          name: 'Conta EUR',
          currency: 'EUR',
          balance: 500,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await mongoConnection.MongoAccount.insertMany(testAccounts);
      
      // Criar o usuário correspondente no PostgreSQL
      const pgUser = await pgModels.User.create({
        id: uuidv4(),
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Executar migração de contas
      const results = await migrationModule.migrateAccounts(
        mongoConnection.MongoAccount,
        mongoConnection.MongoUser,
        pgModels
      );
      
      // Verificar resultados
      expect(results.successCount).to.equal(2);
      expect(results.errorCount).to.equal(0);
      
      // Verificar se as contas foram migradas corretamente
      const pgAccounts = await pgModels.Account.findAll();
      expect(pgAccounts.length).to.equal(2);
      
      // Verificar dados da primeira conta
      const account1 = pgAccounts.find(a => a.accountNumber === 'ACC001');
      expect(account1).to.exist;
      expect(account1.userId).to.equal(pgUser.id);
      expect(account1.currency).to.equal('USD');
      expect(parseFloat(account1.balance)).to.equal(1000);
      
      // Verificar dados da segunda conta
      const account2 = pgAccounts.find(a => a.accountNumber === 'ACC002');
      expect(account2).to.exist;
      expect(account2.userId).to.equal(pgUser.id);
      expect(account2.currency).to.equal('EUR');
      expect(parseFloat(account2.balance)).to.equal(500);
    });
  });
  
  // Testes de Migração de Transações
  describe('Migração de Transações', function() {
    it('deve migrar transações do MongoDB para PostgreSQL', async function() {
      // Criar um usuário de teste no MongoDB
      const mongoUser = await mongoConnection.MongoUser.create({
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Criar contas de teste no MongoDB
      const sourceAccount = await mongoConnection.MongoAccount.create({
        userId: mongoUser._id,
        accountNumber: 'ACC001',
        accountType: 'internal',
        name: 'Conta USD',
        currency: 'USD',
        balance: 1000,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const destAccount = await mongoConnection.MongoAccount.create({
        userId: mongoUser._id,
        accountNumber: 'ACC002',
        accountType: 'internal',
        name: 'Conta EUR',
        currency: 'EUR',
        balance: 500,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Criar transação de teste no MongoDB
      const testTransaction = {
        sourceAccountId: sourceAccount._id,
        destinationAccountId: destAccount._id,
        amount: 100,
        currency: 'USD',
        transactionType: 'transfer',
        status: 'completed',
        description: 'Transferência de teste',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoConnection.MongoTransaction.create(testTransaction);
      
      // Criar o usuário correspondente no PostgreSQL
      const pgUser = await pgModels.User.create({
        id: uuidv4(),
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Criar as contas correspondentes no PostgreSQL
      const pgSourceAccount = await pgModels.Account.create({
        id: uuidv4(),
        userId: pgUser.id,
        accountNumber: 'ACC001',
        accountType: 'internal',
        name: 'Conta USD',
        currency: 'USD',
        balance: 1000,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 100000,
        dailyTransferTotal: 0,
        monthlyTransferTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const pgDestAccount = await pgModels.Account.create({
        id: uuidv4(),
        userId: pgUser.id,
        accountNumber: 'ACC002',
        accountType: 'internal',
        name: 'Conta EUR',
        currency: 'EUR',
        balance: 500,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 100000,
        dailyTransferTotal: 0,
        monthlyTransferTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Executar migração de transações
      const results = await migrationModule.migrateTransactions(
        mongoConnection.MongoTransaction,
        mongoConnection.MongoAccount,
        pgModels
      );
      
      // Verificar resultados
      expect(results.successCount).to.equal(1);
      expect(results.errorCount).to.equal(0);
      
      // Verificar se a transação foi migrada corretamente
      const pgTransactions = await pgModels.Transaction.findAll();
      expect(pgTransactions.length).to.equal(1);
      
      const transaction = pgTransactions[0];
      expect(transaction.sourceAccountId).to.equal(pgSourceAccount.id);
      expect(transaction.destinationAccountId).to.equal(pgDestAccount.id);
      expect(parseFloat(transaction.amount)).to.equal(100);
      expect(transaction.currency).to.equal('USD');
      expect(transaction.transactionType).to.equal('transfer');
      expect(transaction.status).to.equal('completed');
      expect(transaction.description).to.equal('Transferência de teste');
    });
  });
  
  // Testes de Validação de Migração
  describe('Validação de Migração', function() {
    it('deve validar corretamente a migração de usuários', async function() {
      // Criar usuário idêntico no MongoDB e PostgreSQL
      const userData = {
        name: 'Usuário Validação',
        email: 'validacao@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoConnection.MongoUser.create(userData);
      
      await pgModels.User.create({
        id: uuidv4(),
        ...userData
      });
      
      // Executar validação de usuários
      const results = await validationModule.validateUsers(
        mongoConnection.MongoUser,
        pgModels
      );
      
      // Verificar resultados
      expect(results.validCount).to.equal(1);
      expect(results.invalidCount).to.equal(0);
      expect(results.missingCount).to.equal(0);
      expect(results.coverage).to.equal(100);
    });
    
    it('deve identificar usuários com dados inconsistentes', async function() {
      // Criar usuário no MongoDB
      const mongoUser = await mongoConnection.MongoUser.create({
        name: 'Usuário Original',
        email: 'inconsistente@test.com',
        password: 'hashedpassword',
        role: 'client',
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Criar usuário com mesmo email mas dados diferentes no PostgreSQL
      await pgModels.User.create({
        id: uuidv4(),
        name: 'Usuário Alterado',  // Nome diferente
        email: 'inconsistente@test.com',
        password: 'hashedpassword',
        role: 'admin',  // Papel diferente
        documentType: 'cpf',
        documentNumber: '12345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Executar validação de usuários
      const results = await validationModule.validateUsers(
        mongoConnection.MongoUser,
        pgModels
      );
      
      // Verificar resultados
      expect(results.validCount).to.equal(0);
      expect(results.invalidCount).to.equal(1);
      expect(results.missingCount).to.equal(0);
      expect(results.coverage).to.equal(0);
    });
  });
});
