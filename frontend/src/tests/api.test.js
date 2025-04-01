const {
  reservationApi,
  confirmationApi,
  receivingApi,
  sendApi
} = require('../services/api');

// Função auxiliar para log
const logResult = (endpoint, success, data = null, error = null) => {
  console.log(`\n=== Testando ${endpoint} ===`);
  console.log(`Status: ${success ? 'SUCESSO ' : 'FALHA '}`);
  if (data) console.log('Resposta:', JSON.stringify(data, null, 2));
  if (error) console.log('Erro:', error);
  console.log('================\n');
};

// Teste da API de Reserva
async function testReservationAPI() {
  try {
    // Teste para conta USD
    console.log('Testando reserva USD...');
    const usdResponse = await reservationApi.getUSDReservations();
    logResult('Reservation API (USD)', true, usdResponse);

    // Teste para conta EUR
    console.log('Testando reserva EUR...');
    const eurResponse = await reservationApi.getEURReservations();
    logResult('Reservation API (EUR)', true, eurResponse);
  } catch (error) {
    logResult('Reservation API', false, null, error);
  }
}

// Teste da API de Envio
async function testSendAPI() {
  try {
    console.log('Testando envio de transferência...');
    // Primeiro cria uma reserva
    const reserva = await reservationApi.getUSDReservations();
    if (!reserva.reservationCode) {
      console.log('Não há reservas disponíveis para teste de envio');
      return;
    }

    // Depois tenta enviar a transferência
    const response = await sendApi.sendTransfer({
      reservationId: reserva.reservationCode,
      account: '42227',
      amount: 100.00,
      currency: 'USD'
    });
    logResult('Send API', true, response);
  } catch (error) {
    logResult('Send API', false, null, error);
  }
}

// Teste da API de Confirmação
async function testConfirmationAPI() {
  try {
    console.log('Testando confirmação...');
    // Primeiro cria uma reserva
    const reserva = await reservationApi.getUSDReservations();
    if (!reserva.reservationCode) {
      console.log('Não há reservas disponíveis para teste de confirmação');
      return;
    }

    // Depois confirma
    const response = await confirmationApi.confirm(reserva.reservationCode);
    logResult('Confirmation API', true, response);
  } catch (error) {
    logResult('Confirmation API', false, null, error);
  }
}

// Teste da API de Recebimento
async function testReceivingAPI() {
  try {
    console.log('Testando recebimento de transferências...');
    const response = await receivingApi.getIncomingTransfers('42226');
    logResult('Receiving API', true, response);
  } catch (error) {
    logResult('Receiving API', false, null, error);
  }
}

// Executa todos os testes
async function runAllTests() {
  console.log('\n=== Iniciando testes das APIs ===\n');
  
  console.log('1. Testando Reservas...');
  await testReservationAPI();
  
  console.log('2. Testando Envio...');
  await testSendAPI();
  
  console.log('3. Testando Confirmação...');
  await testConfirmationAPI();
  
  console.log('4. Testando Recebimento...');
  await testReceivingAPI();
  
  console.log('\n=== Testes concluídos! ===');
}

// Executa os testes
runAllTests();
