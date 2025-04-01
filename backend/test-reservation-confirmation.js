/**
 * Script de teste para confirmação de reservas
 * Este script testa a confirmação de reservas na API FT de produção
 */
const axios = require('axios');
const dotenv = require('dotenv');
const https = require('https');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API FT (usando as URLs de produção)
const baseUrl = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const apiKey = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const usdAccount = process.env.USD_ACCOUNT || '60428';

// Configurar axios com suporte a certificados autoassinados para HTTPS
const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Permite certificados autoassinados em desenvolvimento
  })
});

// Função para testar a confirmação de reserva
async function testReservationConfirmation() {
  try {
    console.log('Testando confirmação de reserva...');
    const url = `/reservation_confirmation.asp`;
    console.log('URL:', baseUrl + url);
    
    // Dados de confirmação conforme o formato especificado
    const confirmationData = {
      "Reservation_confirmation": {
        "Details": {
          "authToken": "ce8a06d2-f682-11ef-a3af-00155d010b18",
          "Res_code": "d4bc022b-f84c-11ef-a3af-00155d010b18",
          "DateTime": new Date().toISOString(),
          "AccountNumber": usdAccount,
          "Amount": "1000000"
        }
      }
    };
    
    console.log('Dados de confirmação:', JSON.stringify(confirmationData, null, 2));
    
    const response = await api.post(url, confirmationData);
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao confirmar reserva:');
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
  console.log('=== Teste de Confirmação de Reserva (HTTPS) ===');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey);
  console.log('Conta USD:', usdAccount);
  console.log('=======================================\n');
  
  await testReservationConfirmation();
  
  console.log('\n=== Testes concluídos ===');
}

// Iniciar os testes
runTests();
