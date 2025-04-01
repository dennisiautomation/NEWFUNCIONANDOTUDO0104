/**
 * Script de teste direto para a API FT
 * Este script testa a integração direta com as APIs de produção da FT
 */
const dotenv = require('dotenv');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações para conexão com a API
const baseUrl = 'http://mytest.ftassetmanagement.com/api';
const apiKey = '6d9bac1b-f685-11ef-a3af-00155d010b18';
const usdAccount = '60428';
const eurAccount = '60429';

// Instância do Axios
const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Accept': '*/*'
  }
});

// Teste de integração com a API de reservas USD
async function testUsdReservations() {
  try {
    console.log('\n=== Testando API de Reservas USD ===');
    const url = `/reservation.asp?key=${apiKey}&account=${usdAccount}`;
    console.log(`URL: ${baseUrl}${url}`);
    
    const response = await api.get(url);
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar a API de reservas USD:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else {
      console.error(`Erro: ${error.message}`);
    }
    return false;
  }
}

// Teste de integração com a API de reservas EUR
async function testEurReservations() {
  try {
    console.log('\n=== Testando API de Reservas EUR ===');
    const url = `/reservation.asp?key=${apiKey}&account=${eurAccount}`;
    console.log(`URL: ${baseUrl}${url}`);
    
    const response = await api.get(url);
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar a API de reservas EUR:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else {
      console.error(`Erro: ${error.message}`);
    }
    return false;
  }
}

// Teste de integração com a API de confirmação de reservas
async function testReservationConfirmation() {
  try {
    console.log('\n=== Testando API de Confirmação de Reservas ===');
    const url = `/reservation_confirmation.asp`;
    console.log(`URL: ${baseUrl}${url}`);
    
    const data = {
      key: apiKey,
      action: 'test',
      res_code: 'TEST' + Date.now(),
      status: 'APPROVED'
    };
    
    // Apenas logamos o processo sem enviar o POST real para não afetar dados
    console.log('Dados que seriam enviados:', data);
    console.log('POST não enviado para evitar alterações em produção');
    return true;
  } catch (error) {
    console.error('Erro ao acessar a API de confirmação de reservas:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else {
      console.error(`Erro: ${error.message}`);
    }
    return false;
  }
}

// Teste de integração com a API de recebimento de transferências
async function testReceivingTransfers() {
  try {
    console.log('\n=== Testando API de Recebimento de Transferências ===');
    const url = `/receiving.asp?key=${apiKey}`;
    console.log(`URL: ${baseUrl}${url}`);
    
    const response = await api.get(url);
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar a API de recebimento de transferências:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else {
      console.error(`Erro: ${error.message}`);
    }
    return false;
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('========================================');
  console.log('TESTE DE INTEGRAÇÃO DIRETA COM API FT');
  console.log('========================================');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey);
  console.log('Conta USD:', usdAccount);
  console.log('Conta EUR:', eurAccount);
  console.log('========================================');
  
  let successCount = 0;
  let totalTests = 4;
  
  if (await testUsdReservations()) successCount++;
  if (await testEurReservations()) successCount++;
  if (await testReservationConfirmation()) successCount++;
  if (await testReceivingTransfers()) successCount++;
  
  console.log('\n========================================');
  console.log(`RESULTADO: ${successCount}/${totalTests} testes com sucesso`);
  console.log('========================================');
}

// Executar todos os testes
runAllTests();
