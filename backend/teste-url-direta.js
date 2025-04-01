/**
 * Script para testar diretamente a URL fornecida no email
 */
const axios = require('axios');

// URL fornecida diretamente no email
const USD_URL = 'https://my.ftassetmanagement.com/api/reservation.asp?key=36bd30d0-f685-11ef-a3af-00155d010b18&account=60428';
const EUR_URL = 'https://my.ftassetmanagement.com/api/reservation.asp?key=36bd30d0-f685-11ef-a3af-00155d010b18&account=60429';
const CONFIRMATION_URL = 'https://my.ftassetmanagement.com/api/reservation_confirmation.asp';

/**
 * Faz requisição para uma URL
 */
async function testUrl(url, label) {
  console.log(`\n🔍 Testando URL ${label}: ${url}`);
  
  try {
    const response = await axios.get(url);
    console.log(`✅ Resposta: ${response.status} ${response.statusText}`);
    
    // Mostrar os dados da resposta
    console.log('Dados:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
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
 * Função principal
 */
async function main() {
  console.log('===========================================');
  console.log('🧪 TESTE DE URLs FORNECIDAS DIRETAMENTE');
  console.log('===========================================');
  
  // Testar URL USD
  await testUrl(USD_URL, 'USD');
  
  // Testar URL EUR
  await testUrl(EUR_URL, 'EUR');
  
  // Informação sobre confirmação
  console.log('\n📋 Informações sobre confirmação:');
  console.log(`URL: ${CONFIRMATION_URL}`);
  console.log('Método: POST');
  console.log('Formato do corpo:');
  console.log(`{
  "Reservation_confirmation v0.9": {
    "Details": {
      "authToken": "36bd30d0-f685-11ef-a3af-00155d010b18",
      "Res_code": "UUID#",
      "DateTime": "DATETIME",
      "AccountNumber": "60428",
      "Amount": "VALUE"
    }
  }
}`);
  
  console.log('\n✅ Teste concluído');
  console.log('===========================================');
}

// Executar
main();
