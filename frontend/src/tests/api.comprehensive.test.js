const { 
  reservationApi, 
  confirmationApi, 
  receivingApi, 
  sendApi, 
  transferService 
} = require('../services/api');

async function testTransferWorkflow() {
  console.log('\n TESTANDO FLUXO COMPLETO DE TRANSFERÊNCIA\n');

  // Teste 1: Transferência USD
  try {
    console.log('Teste 1: Transferência USD');
    const params = {
      fromAccount: '42226',
      toAccount: '42227',
      amount: 100,
      currency: 'USD'
    };
    const result = await transferService.executeTransfer(params);
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Transferência USD ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Transferência USD ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 2: Transferência EUR
  try {
    console.log('Teste 2: Transferência EUR');
    const params = {
      fromAccount: '42227',
      toAccount: '42226',
      amount: 100,
      currency: 'EUR'
    };
    const result = await transferService.executeTransfer(params);
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Transferência EUR ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Transferência EUR ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 3: Transferência com erro
  try {
    console.log('Teste 3: Transferência com erro');
    const params = { fromAccount: '', toAccount: '42226', amount: 100 };
    const result = await transferService.executeTransfer(params);
    
    if (result.success) {
      throw new Error('Deveria ter falhado');
    }
    
    if (result.error !== 'Conta de origem é obrigatória') {
      throw new Error(`Erro inesperado: ${result.error}`);
    }
    
    console.log('\n=== Transferência Inválida ===');
    console.log('Status: SUCESSO');
    console.log('Erro esperado:', result.error);
    console.log('================\n');
  } catch (error) {
    if (error.message === 'Deveria ter falhado') {
      console.log('\n=== Transferência Inválida ===');
      console.log('Status: FALHA');
      console.log('Erro:', 'A transferência deveria ter falhado mas foi bem sucedida');
      console.log('================\n');
      throw error;
    }
    
    if (error.message.startsWith('Erro inesperado:')) {
      console.log('\n=== Transferência Inválida ===');
      console.log('Status: FALHA');
      console.log('Erro:', error.message);
      console.log('================\n');
      throw error;
    }
    
    console.log('\n=== Transferência Inválida ===');
    console.log('Status: SUCESSO');
    console.log('Erro:', error.message);
    console.log('================\n');
  }
}

async function testReservationApi() {
  console.log('\n TESTANDO API DE RESERVA\n');

  try {
    // Teste 1: Criar reserva USD
    console.log('Teste 1: Criar reserva USD');
    const result = await reservationApi.createReservation({ account: '42226' });
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Reserva USD ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result.data, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Reserva USD ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }
}

async function testReceivingApi() {
  console.log('\n TESTANDO API DE RECEBIMENTO\n');

  // Teste 1: Buscar transferências USD
  try {
    console.log('Teste 1: Buscar transferências USD');
    const result = await receivingApi.getIncomingTransfers('42226');
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Transferências USD ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Transferências USD ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 2: Buscar transferências EUR
  try {
    console.log('Teste 2: Buscar transferências EUR');
    const result = await receivingApi.getIncomingTransfers('42227');
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Transferências EUR ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Transferências EUR ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 3: Buscar sem conta
  try {
    console.log('Teste 3: Buscar sem conta');
    const result = await receivingApi.getIncomingTransfers();
    if (result.success) {
      throw new Error('Deveria ter falhado');
    }
    console.log('\n=== Busca Inválida ===');
    console.log('Status: SUCESSO');
    console.log('Erro:', result.error);
    console.log('================\n');
  } catch (error) {
    if (error.message === 'Deveria ter falhado') {
      console.log('\n=== Busca Inválida ===');
      console.log('Status: FALHA');
      console.log('Erro:', 'A busca deveria ter falhado mas foi bem sucedida');
      console.log('================\n');
      throw error;
    }
    console.log('\n=== Busca Inválida ===');
    console.log('Status: SUCESSO');
    console.log('Erro:', error.message);
    console.log('================\n');
  }
}

async function testSendApi() {
  console.log('\n TESTANDO API DE ENVIO\n');

  try {
    // Teste 1: Enviar usando código de reserva
    console.log('Teste 1: Enviar usando código de reserva');
    const reserva = await reservationApi.createReservation({ account: '42226' });
    if (!reserva.success) throw new Error(reserva.error);
    
    const result = await sendApi.sendTransfer({ reservationId: reserva.reservationCode });
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Envio com Reserva ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Envio com Reserva ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }
}

async function testConfirmationApi() {
  console.log('\n TESTANDO API DE CONFIRMAÇÃO\n');

  // Teste 1: Confirmar reserva válida
  try {
    console.log('Teste 1: Confirmar reserva válida');
    const result = await confirmationApi.confirm('TEST-123');
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Confirmação Válida ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result.data, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Confirmação Válida ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 2: Confirmar outra reserva
  try {
    console.log('Teste 2: Confirmar outra reserva');
    const result = await confirmationApi.confirm('TEST-124');
    if (!result.success) throw new Error(result.error);
    
    console.log('\n=== Segunda Confirmação ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(result.data, null, 2));
    console.log('================\n');
  } catch (error) {
    console.log('\n=== Segunda Confirmação ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }

  // Teste 3: Confirmar sem código
  try {
    console.log('Teste 3: Confirmar sem código');
    const result = await confirmationApi.confirm();
    if (result.success) {
      throw new Error('Deveria ter falhado');
    }
    console.log('\n=== Confirmação Sem Código ===');
    console.log('Status: SUCESSO');
    console.log('Erro:', result.error);
    console.log('================\n');
  } catch (error) {
    if (error.message === 'Deveria ter falhado') {
      console.log('\n=== Confirmação Sem Código ===');
      console.log('Status: FALHA');
      console.log('Erro:', 'A confirmação deveria ter falhado mas foi bem sucedida');
      console.log('================\n');
      throw error;
    }
    console.log('\n=== Confirmação Sem Código ===');
    console.log('Status: SUCESSO');
    console.log('Erro:', error.message);
    console.log('================\n');
  }
}

async function testComplexScenarios() {
  console.log('\n TESTANDO CENÁRIOS COMPLEXOS\n');

  try {
    // Teste 1: Fluxo completo USD
    console.log('Teste 1: Fluxo completo USD');
    
    // 1.1 Criar reserva
    const reserva = await reservationApi.createReservation({ account: '42226' });
    if (!reserva.success) throw new Error(reserva.error);
    
    console.log('\n=== 1.1 Criar Reserva ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(reserva.data, null, 2));
    console.log('================\n');

    // 1.2 Enviar transferência
    const envio = await sendApi.sendTransfer({ reservationId: reserva.reservationCode });
    if (!envio.success) throw new Error(envio.error);
    
    console.log('\n=== 1.2 Enviar Transferência ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(envio.data, null, 2));
    console.log('================\n');

    // 1.3 Confirmar transferência
    const confirmacao = await confirmationApi.confirm(reserva.reservationCode);
    if (!confirmacao.success) throw new Error(confirmacao.error);
    
    console.log('\n=== 1.3 Confirmar Transferência ===');
    console.log('Status: SUCESSO');
    console.log('Resposta:', JSON.stringify(confirmacao.data, null, 2));
    console.log('================\n');

  } catch (error) {
    console.log('\n=== Cenários Complexos ===');
    console.log('Status: FALHA');
    console.log('Erro:', error.message);
    console.log('================\n');
    throw error;
  }
}

async function runAllTests() {
  console.log(' INICIANDO TESTES COMPLETOS DAS APIS\n');

  try {
    await testTransferWorkflow();
    await testReservationApi();
    await testReceivingApi();
    await testSendApi();
    await testConfirmationApi();
    await testComplexScenarios();
  } catch (error) {
    console.error('Erro nos testes:', error);
  }

  console.log('\n TESTES CONCLUÍDOS!');
}

runAllTests();
