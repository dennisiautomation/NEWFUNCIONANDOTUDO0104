const accountService = require('../services/accountService');

async function testarConta() {
  console.log('\n=== Testando Acesso à Conta ===\n');

  // Simula login do usuário
  accountService.setCurrentUser({
    id: 1,
    name: 'João Silva',
    accountNumber: '42226',  // Conta USD
    email: 'joao@example.com'
  });

  // 1. Tentar acessar própria conta (deve funcionar)
  console.log('1. Acessando própria conta:');
  const saldoProprio = await accountService.getBalance('42226');
  console.log(saldoProprio);

  // 2. Tentar acessar outra conta (deve falhar)
  console.log('\n2. Tentando acessar outra conta:');
  const saldoOutro = await accountService.getBalance('42227');
  console.log(saldoOutro);

  // 3. Buscar transferências recebidas
  console.log('\n3. Buscando transferências recebidas:');
  const recebidas = await accountService.getIncomingTransfers();
  console.log(recebidas);
}

// Executa o teste
testarConta();
