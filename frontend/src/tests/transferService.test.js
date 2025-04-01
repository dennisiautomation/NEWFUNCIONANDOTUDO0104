const transferService = require('../services/transferService');

async function testarTransferencia() {
  console.log('\n=== Testando Transferência ===\n');

  // Exemplo: Cliente com conta USD transferindo para outra conta
  const resultado = await transferService.transfer({
    fromAccount: '42226',    // Conta USD do cliente
    toAccount: '12345',      // Conta destino
    amount: 100.00,
    currency: 'USD'
  });

  console.log('Resultado:', JSON.stringify(resultado, null, 2));
}

// Executa o teste
testarTransferencia();
