/**
 * Teste dos endpoints de produção da API FT Asset Management
 * Verifica se as conexões com as APIs estão funcionando corretamente
 */
require('dotenv').config();
const axios = require('axios');

// Configurações da API
const BASE_URL = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const API_KEY = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = process.env.USD_ACCOUNT || '60428';
const EUR_ACCOUNT = process.env.EUR_ACCOUNT || '60429';

console.log('==== TESTE DE CONEXÃO COM AS APIS DE PRODUÇÃO DA FT ====');
console.log('URL Base:', BASE_URL);
console.log('Chave API:', API_KEY ? '***CONFIGURADA***' : 'NÃO CONFIGURADA');
console.log('Conta USD:', USD_ACCOUNT);
console.log('Conta EUR:', EUR_ACCOUNT);
console.log('Data/Hora do teste:', new Date().toLocaleString());
console.log('===============================================');

// Função auxiliar para realizar requisição
async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n${method} ${url}`);
    
    const config = {
      method,
      url,
      ...(data && { data })
    };
    
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
    console.log('📄 Resposta:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log(`❌ ERRO: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Resposta de erro:');
      console.log(error.response.data);
    }
    return null;
  }
}

// Testar todos os endpoints disponíveis
async function runTests() {
  console.log('\n=== TESTE 1: Endpoint de Reservas USD ===');
  await makeRequest(`/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`);
  
  console.log('\n=== TESTE 2: Endpoint de Reservas EUR ===');
  await makeRequest(`/reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`);
  
  console.log('\n=== TESTE 3: Endpoint de Confirmação (Simulação) ===');
  // Simulação apenas - não confirma transação real
  const confirmationData = {
    Details: {
      authToken: "teste-36bd30d0-f685-11ef-a3af-00155d010b18",
      Res_code: "SIMULATED-TEST",
      DateTime: new Date().toISOString(),
      AccountNumber: USD_ACCOUNT,
      Amount: "0.01"
    }
  };
  await makeRequest(`/reservation_confirmation.asp`, 'POST', confirmationData);
  
  console.log('\n=== TESTE 4: Endpoint de Recebimento de Transferências ===');
  await makeRequest(`/receiving.asp?key=${API_KEY}`);
  
  console.log('\n==== TESTE CONCLUÍDO ====');
}

// Executar testes
runTests().catch(console.error);
