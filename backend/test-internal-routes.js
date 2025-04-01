/**
 * Teste das rotas internas com banco PostgreSQL
 * Este script irá testar as rotas básicas de usuários e contas internas
 */
require('dotenv').config();
const axios = require('axios');
const { sequelize, User, Account } = require('./pg-models');

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
let authToken = null;
let testUserId = null;
let testAccountId = null;

// Configuração para evitar erros de certificado em desenvolvimento
axios.defaults.validateStatus = () => true;

// Use localhost em vez de IPv6
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Limpa o banco e cria um usuário de teste
 */
async function setupDatabase() {
  try {
    console.log('Conectando ao PostgreSQL...');
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida com sucesso!');
    
    // Sincroniza os modelos com o banco de dados (force: true para recriar as tabelas)
    console.log('Sincronizando modelos com o banco de dados...');
    await sequelize.sync({ force: true });
    console.log('Modelos sincronizados com sucesso!');
    
    // Cria um usuário de teste
    console.log('Criando usuário de teste...');
    const adminUser = await User.create({
      name: 'Administrador',
      email: 'admin@newcash.com',
      password: 'Senha123!',
      role: 'admin',
      status: 'active'
    });
    
    console.log(`Usuário de teste criado com ID: ${adminUser.id}`);
    testUserId = adminUser.id;
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:', error);
    return false;
  }
}

/**
 * Testa o registro de um novo usuário
 */
async function testRegister() {
  try {
    console.log('\n--- Testando registro de novo usuário ---');
    const response = await axios.post('/internal/users/register', {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      password: 'Senha123!',
      role: 'client'
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', response.data);
    
    return response.status === 201 && response.data.status === 'success';
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);
    return false;
  }
}

/**
 * Testa o login de usuário
 */
async function testLogin() {
  try {
    console.log('\n--- Testando login ---');
    const response = await axios.post('/internal/users/login', {
      email: 'admin@newcash.com',
      password: 'Senha123!'
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', response.data);
    
    if (response.status === 200 && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('Token obtido com sucesso!');
      return true;
    } else if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log('Token obtido com sucesso!');
      return true;
    } else {
      console.log('Falha ao obter token');
      return false;
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    return false;
  }
}

/**
 * Testa a criação de uma nova conta interna
 */
async function testCreateAccount() {
  try {
    console.log('\n--- Testando criação de conta interna ---');
    
    const response = await axios.post(
      '/internal/accounts',
      {
        userId: testUserId,
        currency: 'USD',
        name: 'Conta USD Teste',
        status: 'active',
        accountType: 'internal'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', response.data);
    
    if (response.status === 201 && response.data.data) {
      testAccountId = response.data.data.id;
      console.log(`Conta criada com ID: ${testAccountId}`);
      return true;
    } else {
      console.log('Falha ao criar conta');
      return false;
    }
  } catch (error) {
    console.error('Erro ao criar conta:', error.message);
    return false;
  }
}

/**
 * Testa a listagem de contas
 */
async function testListAccounts() {
  try {
    console.log('\n--- Testando listagem de contas ---');
    
    const response = await axios.get(
      '/internal/accounts',
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', response.data);
    
    return response.status === 200 && response.data.status === 'success';
  } catch (error) {
    console.error('Erro ao listar contas:', error.message);
    return false;
  }
}

/**
 * Testa um depósito em conta interna
 */
async function testDeposit() {
  try {
    console.log('\n--- Testando depósito em conta interna ---');
    
    const response = await axios.post(
      '/internal/accounts/deposit',
      {
        accountId: testAccountId,
        amount: 1000,
        description: 'Depósito inicial teste'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', response.data);
    
    return response.status === 200 && response.data.status === 'success';
  } catch (error) {
    console.error('Erro ao fazer depósito:', error.message);
    return false;
  }
}

/**
 * Executa todos os testes em sequência
 */
async function runTests() {
  console.log('=== INICIANDO TESTES DAS ROTAS INTERNAS ===');
  
  // Setup do banco de dados
  const dbSetup = await setupDatabase();
  if (!dbSetup) {
    console.error('Falha na configuração do banco de dados. Encerrando testes.');
    process.exit(1);
  }
  
  // Inicia o servidor (opcional, geralmente o servidor já está rodando em outro processo)
  console.log('\nMake sure the server is running before continuing!');
  
  // Testes
  const tests = [
    { name: 'Registro de usuário', fn: testRegister },
    { name: 'Login de usuário', fn: testLogin },
    { name: 'Criação de conta', fn: testCreateAccount },
    { name: 'Listagem de contas', fn: testListAccounts },
    { name: 'Depósito em conta', fn: testDeposit }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      console.log(`✅ Teste "${test.name}" passou!`);
      passedTests++;
    } else {
      console.log(`❌ Teste "${test.name}" falhou!`);
      failedTests++;
    }
  }
  
  // Resumo
  console.log('\n=== RESUMO DOS TESTES ===');
  console.log(`Total: ${tests.length}`);
  console.log(`Passou: ${passedTests}`);
  console.log(`Falhou: ${failedTests}`);
  
  // Fechar a conexão com o banco de dados
  await sequelize.close();
  console.log('\nTestes concluídos!');
}

// Executa os testes
runTests().catch(err => {
  console.error('Erro ao executar testes:', err);
  process.exit(1);
});
