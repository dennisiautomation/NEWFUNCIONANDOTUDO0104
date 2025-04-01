require('dotenv').config();
const { sequelize, testPostgresConnection } = require('./config/database');
const { syncModels, User, Account } = require('./pg-models');

// Função para testar a criação de um usuário
const testCreateUser = async () => {
  try {
    const user = await User.create({
      name: 'Usuário Teste',
      email: 'teste@example.com',
      password: 'senha123',
      role: 'client',
      documentType: 'CPF',
      documentNumber: '123.456.789-00'
    });
    
    console.log('Usuário criado com sucesso:', user.id);
    return user;
  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    return null;
  }
};

// Função para testar a criação de uma conta interna
const testCreateAccount = async (userId) => {
  try {
    // Gerar número da conta
    const accountNumber = await Account.generateAccountNumber('USD');
    
    const account = await Account.create({
      accountNumber,
      accountType: 'USD',
      userId,
      balance: 1000.00,
      isInternal: true
    });
    
    console.log('Conta criada com sucesso:', account.id, 'Número:', account.accountNumber);
    return account;
  } catch (error) {
    console.error('Erro ao criar conta:', error.message);
    return null;
  }
};

// Função para testar a busca de usuário com suas contas
const testFindUserWithAccounts = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [{ model: Account, as: 'accounts' }]
    });
    
    console.log('Usuário encontrado:');
    console.log('- Nome:', user.name);
    console.log('- Email:', user.email);
    console.log('- Contas:', user.accounts.length);
    
    user.accounts.forEach(account => {
      console.log(`  - ${account.accountType}: ${account.accountNumber} (Saldo: ${account.balance})`);
    });
    
    return user;
  } catch (error) {
    console.error('Erro ao buscar usuário com contas:', error.message);
    return null;
  }
};

// Função principal para executar os testes
const runTests = async () => {
  console.log('Iniciando testes do PostgreSQL...');
  
  // Testar conexão
  await testPostgresConnection();
  
  // Sincronizar modelos (force: true recria as tabelas)
  // ATENÇÃO: em produção, usar force: false ou substituir por migrations
  const synced = await syncModels(true);
  
  if (!synced) {
    console.error('Falha na sincronização dos modelos. Abortando testes.');
    return;
  }
  
  // Criar usuário de teste
  const user = await testCreateUser();
  if (!user) return;
  
  // Criar conta de teste
  const account = await testCreateAccount(user.id);
  if (!account) return;
  
  // Buscar usuário com suas contas
  await testFindUserWithAccounts(user.id);
  
  console.log('Testes concluídos com sucesso!');
};

// Executar os testes
runTests()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro nos testes:', error);
    process.exit(1);
  });
