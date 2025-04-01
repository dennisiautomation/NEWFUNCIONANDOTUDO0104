/**
 * Script de teste para a API FT de produção
 * Este script testa a conexão com a API FT de produção usando HTTPS
 */
const axios = require('axios');
const dotenv = require('dotenv');
const https = require('https');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API FT (usando as URLs de produção)
const baseUrl = process.env.FT_API_BASE_URL || 'http://mytest.ftassetmanagement.com/api';
const apiKey = process.env.FT_API_KEY || '6d9bac1b-f685-11ef-a3af-00155d010b18';
const usdAccount = process.env.USD_ACCOUNT || '60428';
const eurAccount = process.env.EUR_ACCOUNT || '60429';

// Configurar axios com suporte a certificados autoassinados para HTTPS
const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Accept': '*/*'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Permite certificados autoassinados em desenvolvimento
  })
});

// Função para testar a API de reservas USD
async function testUsdReservations() {
  try {
    console.log('Testando API de reservas USD...');
    const url = `/reservation.asp?key=${apiKey}&account=${usdAccount}`;
    console.log('URL:', baseUrl + url);
    
    const response = await api.get(url);
    
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
    const url = `/reservation.asp?key=${apiKey}&account=${eurAccount}`;
    console.log('URL:', baseUrl + url);
    
    const response = await api.get(url);
    
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
  console.log('=== Teste da API FT de Produção (HTTPS) ===');
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
