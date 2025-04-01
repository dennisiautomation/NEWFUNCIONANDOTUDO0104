const { reservationApi, sendApi, confirmationApi } = require('../services/api');

async function testarFluxoTransferencia() {
  try {
    console.log('\n=== Testando Fluxo Completo de Transferência ===\n');
    
    // 1. Criar Reserva (como o frontend faria)
    console.log('1. Criando reserva USD...');
    const reserva = await reservationApi.getUSDReservations();
    console.log('Resposta:', JSON.stringify(reserva, null, 2));
    
    if (!reserva.success) {
      throw new Error(`Erro ao criar reserva: ${reserva.error}`);
    }
    
    // 2. Enviar Transferência (como o frontend faria)
    console.log('\n2. Enviando transferência...');
    const transferencia = await sendApi.sendTransfer({
      reservationId: reserva.reservationCode,
      account: '42227',
      amount: 100.00,
      currency: 'USD'
    });
    console.log('Resposta:', JSON.stringify(transferencia, null, 2));
    
    if (!transferencia.success) {
      throw new Error(`Erro ao enviar transferência: ${transferencia.error}`);
    }
    
    // 3. Confirmar Transferência (como o frontend faria)
    console.log('\n3. Confirmando transferência...');
    const confirmacao = await confirmationApi.confirm(reserva.reservationCode);
    console.log('Resposta:', JSON.stringify(confirmacao, null, 2));
    
    if (!confirmacao.success) {
      throw new Error(`Erro ao confirmar transferência: ${confirmacao.error}`);
    }
    
    console.log('\n=== Fluxo completo executado com sucesso! ===');
    
  } catch (error) {
    console.error('\nErro no fluxo:', error.message);
  }
}

// Executa o teste
testarFluxoTransferencia();
