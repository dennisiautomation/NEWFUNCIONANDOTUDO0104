const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API FT
const baseUrl = process.env.FT_API_BASE_URL || 'http://mytest.ftassetmanagement.com/api';
const apiKey = process.env.FT_API_KEY || '6d9bac1b-f685-11ef-a3af-00155d010b18';
const usdAccount = process.env.USD_ACCOUNT || '60428';
const eurAccount = process.env.EUR_ACCOUNT || '60429';

// Função para testar a API de reservas USD
async function testUsdReservations() {
  try {
    console.log('Testando API de reservas USD...');
    console.log('URL:', `${baseUrl}/Reservation.asp?key=${apiKey}&account=${usdAccount}`);
    
    const response = await axios.get(`${baseUrl}/Reservation.asp?key=${apiKey}&account=${usdAccount}`);
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao acessar API de reservas USD:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    return null;
  }
}

// Função para testar a API de reservas EUR
async function testEurReservations() {
  try {
    console.log('\nTestando API de reservas EUR...');
    console.log('URL:', `${baseUrl}/Reservation.asp?key=${apiKey}&account=${eurAccount}`);
    
    const response = await axios.get(`${baseUrl}/Reservation.asp?key=${apiKey}&account=${eurAccount}`);
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao acessar API de reservas EUR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    return null;
  }
}

// Executar os testes
async function runTests() {
  console.log('=== Teste de Integração com API FT ===');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey);
  console.log('Conta USD:', usdAccount);
  console.log('Conta EUR:', eurAccount);
  console.log('=======================================\n');
  
  await testUsdReservations();
  await testEurReservations();
  
  console.log('\n=== Testes concluídos ===');
}

// Iniciar os testes
runTests();
