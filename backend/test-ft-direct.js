/**
 * Script de teste direto para a API FT
 * Este script testa a conexão direta com a API FT usando HTTP
 */
const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API FT (usando HTTP conforme a memória)
const baseUrl = 'http://mytest.ftassetmanagement.com/api';
const apiKey = '6d9bac1b-f685-11ef-a3af-00155d010b18';
const usdAccount = '60428';
const eurAccount = '60429';

// Função para testar a API de reservas USD
async function testUsdReservations() {
  try {
    console.log('Testando API de reservas USD...');
    const url = `${baseUrl}/Reservation.asp?key=${apiKey}&account=${usdAccount}`;
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
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
    const url = `${baseUrl}/Reservation.asp?key=${apiKey}&account=${eurAccount}`;
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
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
  console.log('=== Teste Direto da API FT (HTTP) ===');
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
