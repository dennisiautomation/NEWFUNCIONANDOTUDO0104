/**
 * Teste das contas originais mencionadas na última mensagem
 */
require('dotenv').config();
const axios = require('axios');

// API config
const BASE_URL = 'https://my.ftassetmanagement.com/api';
const API_KEY = '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '42226'; // Conta original mencionada
const EUR_ACCOUNT = '42227'; // Conta original mencionada

async function checkAccount(accountNumber, label) {
  try {
    console.log(`\nVerificando conta ${label}: ${accountNumber}`);
    
    const url = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${accountNumber}`;
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url);
    console.log(`Status: ${response.status}`);
    console.log('Resposta:');
    console.log(response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Erro na conta ${label}: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(error.response.data);
    }
    return null;
  }
}

async function main() {
  console.log('=== TESTE DE CONTAS ORIGINAIS ===');
  
  // Verificar conta USD original
  await checkAccount(USD_ACCOUNT, 'USD');
  
  // Verificar conta EUR original
  await checkAccount(EUR_ACCOUNT, 'EUR');
  
  console.log('\n=== TESTE CONCLUÍDO ===');
}

main();
