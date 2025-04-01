const { receivingApi } = require('../services/api');

async function testarRecebimento() {
  try {
    console.log('\n=== Testando API de Recebimento ===\n');
    
    // Testar recebimento
    console.log('1. Testando recebimento...');
    const recebimento = await receivingApi.getIncomingTransfers();
    console.log('Resposta:', JSON.stringify(recebimento, null, 2));
    
    if (recebimento.success) {
      console.log('\nTransferências recebidas:', recebimento.transfers.length);
      recebimento.transfers.forEach((transfer, index) => {
        console.log(`\nTransferência ${index + 1}:`);
        console.log('- ID:', transfer.transferId);
        console.log('- Valor:', transfer.amount, transfer.currency);
        console.log('- De:', transfer.senderName);
        console.log('- Para:', transfer.receiverName);
        console.log('- Data:', transfer.datetime);
      });
    }
    
    console.log('\n=== Testes concluídos! ===');
    
  } catch (error) {
    console.error('\nErro no teste:', error.message);
  }
}

// Executa o teste
testarRecebimento();
