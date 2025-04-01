/**
 * Script para verificar saldo e transações das contas em produção
 * Usando as contas corretas: USD (60248) e EUR (60429)
 */
const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração para produção
const BASE_URL = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const API_KEY = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = process.env.USD_ACCOUNT || '60248';
const EUR_ACCOUNT = process.env.EUR_ACCOUNT || '60429';

// URLs de produção
const USD_RESERVATION_URL = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`;
const EUR_RESERVATION_URL = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`;
const CONFIRMATION_URL = `${BASE_URL}/reservation_confirmation.asp`;
const RECEIVING_URL = `${BASE_URL}/receiving.asp?key=${API_KEY}`;

// Possíveis endpoints para verificar saldo
const POSSIBLE_BALANCE_ENDPOINTS = [
  `/balance.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/account.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/statement.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/info.asp?key=${API_KEY}&account=${USD_ACCOUNT}`
];

// Possíveis endpoints para histórico de transações
const POSSIBLE_HISTORY_ENDPOINTS = [
  `/history.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/transactions.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/statement.asp?key=${API_KEY}&account=${USD_ACCOUNT}`,
  `/ledger.asp?key=${API_KEY}&account=${USD_ACCOUNT}`
];

/**
 * Formata valor monetário
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Faz requisição para uma URL
 */
async function makeRequest(url, method = 'GET', data = null) {
  console.log(`\n🔍 Fazendo requisição ${method} para: ${url}`);
  
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(url);
    } else if (method === 'POST') {
      response = await axios.post(url, data);
    }
    
    console.log(`✅ Resposta: ${response.status} ${response.statusText}`);
    
    // Verificar se é JSON válido
    let responseData = response.data;
    try {
      if (typeof responseData === 'string') {
        // Corrigir qualquer problema de formatação JSON
        responseData = responseData.replace(/,(\s*})/g, '$1');
        responseData = JSON.parse(responseData);
      }
      
      console.log('Dados da resposta (formatados):');
      console.log(JSON.stringify(responseData, null, 2));
      
      return responseData;
    } catch (jsonError) {
      console.log('Dados da resposta (não puderam ser formatados como JSON):');
      console.log(responseData);
      return responseData;
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(error.response.data);
    }
    return null;
  }
}

/**
 * Verifica reservas pendentes
 */
async function checkReservations() {
  console.log('\n📝 VERIFICANDO RESERVAS PENDENTES...');
  
  // Verificar reservas USD
  console.log('\n=== CONTA USD ===');
  const usdResult = await makeRequest(USD_RESERVATION_URL);
  
  // Verificar reservas EUR
  console.log('\n=== CONTA EUR ===');
  const eurResult = await makeRequest(EUR_RESERVATION_URL);
  
  return { usdResult, eurResult };
}

/**
 * Tenta verificar o saldo das contas
 */
async function checkBalance() {
  console.log('\n💰 TENTANDO VERIFICAR SALDO...');
  
  // Tentar diferentes endpoints para saldo
  for (const endpoint of POSSIBLE_BALANCE_ENDPOINTS) {
    console.log(`\n=== TENTANDO ENDPOINT: ${endpoint} ===`);
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url);
    
    if (result && !result.error && !result.Information) {
      console.log(`✅ Endpoint ${endpoint} pode conter informações de saldo!`);
    }
  }
  
  // Tentar endpoint EUR
  const eurBalanceUrl = `${BASE_URL}/balance.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`;
  console.log(`\n=== TENTANDO SALDO EUR: ${eurBalanceUrl} ===`);
  await makeRequest(eurBalanceUrl);
}

/**
 * Tenta verificar o histórico de transações
 */
async function checkTransactionHistory() {
  console.log('\n📊 TENTANDO VERIFICAR HISTÓRICO DE TRANSAÇÕES...');
  
  // Tentar diferentes endpoints para histórico
  for (const endpoint of POSSIBLE_HISTORY_ENDPOINTS) {
    console.log(`\n=== TENTANDO ENDPOINT: ${endpoint} ===`);
    const url = `${BASE_URL}${endpoint}`;
    const result = await makeRequest(url);
    
    if (result && !result.error && !result.Information) {
      console.log(`✅ Endpoint ${endpoint} pode conter informações de histórico!`);
    }
  }
  
  // Tentar endpoint EUR
  const eurHistoryUrl = `${BASE_URL}/history.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`;
  console.log(`\n=== TENTANDO HISTÓRICO EUR: ${eurHistoryUrl} ===`);
  await makeRequest(eurHistoryUrl);
}

/**
 * Verifica transferências recebidas
 */
async function checkIncomingTransfers() {
  console.log('\n📥 VERIFICANDO TRANSFERÊNCIAS RECEBIDAS...');
  await makeRequest(RECEIVING_URL);
}

/**
 * Função principal
 */
async function main() {
  console.log('===========================================');
  console.log('🏦 VERIFICAÇÃO DE CONTAS EM PRODUÇÃO');
  console.log('===========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log('===========================================');
  
  // Verificar reservas
  await checkReservations();
  
  // Verificar saldo
  await checkBalance();
  
  // Verificar histórico
  await checkTransactionHistory();
  
  // Verificar transferências recebidas
  await checkIncomingTransfers();
  
  console.log('\n===========================================');
  console.log('✅ VERIFICAÇÃO COMPLETA');
  console.log('===========================================');
  
  // Informação sobre confirmação
  console.log('\n📋 Para confirmar reservas (SEM EXECUTAR AGORA):');
  console.log(`URL: ${CONFIRMATION_URL}`);
  console.log('Método: POST');
  console.log('Formato do corpo:');
  console.log(`{
  "Reservation_confirmation v0.9": {
    "Details": {
      "authToken": "${API_KEY}",
      "Res_code": "CÓDIGO_DA_RESERVA",
      "DateTime": "${new Date().toISOString()}",
      "AccountNumber": "${USD_ACCOUNT}",
      "Amount": "VALOR"
    }
  }
}`);
  
  console.log('\n⚠️ LEMBRE-SE: NÃO CONFIRME NENHUMA TRANSAÇÃO SEM VERIFICAÇÃO COMPLETA');
  console.log('===========================================');
}

// Executar
main().catch(error => {
  console.error('Erro na execução:', error);
});
