/**
 * Script para verificar as contas no ambiente de teste
 * conforme informações das memórias
 */
const axios = require('axios');

// Configuração para ambiente de teste (conforme memória)
const BASE_URL = 'http://mytest.ftassetmanagement.com/api';
const API_KEY = '6d9bac1b-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

// URLs de teste
const USD_URL = `${BASE_URL}/Reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`;
const EUR_URL = `${BASE_URL}/Reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`;
const CONFIRMATION_URL = `${BASE_URL}/Reservation_confirmation.asp`;
const RECEIVING_URL = `${BASE_URL}/receiving.asp?key=${API_KEY}`;

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
async function testUrl(url, label) {
  console.log(`\n🔍 Testando URL ${label}: ${url}`);
  
  try {
    const response = await axios.get(url);
    console.log(`✅ Resposta: ${response.status} ${response.statusText}`);
    
    // Verificar se é JSON válido
    let data = response.data;
    try {
      if (typeof data === 'string') {
        // Corrigir qualquer problema de formatação JSON
        data = data.replace(/,(\s*})/g, '$1');
        data = JSON.parse(data);
      }
      
      console.log('Dados (formatados):');
      console.log(JSON.stringify(data, null, 2));
      
      // Extrair informações sobre reservas se disponíveis
      if (data && data["ReservationsOverview 0.9"]) {
        const overview = data["ReservationsOverview 0.9"];
        console.log('\n=== DETALHES DA RESERVA ===');
        console.log(`Nome: ${overview.Name || 'N/A'}`);
        console.log(`País: ${overview.Country || 'N/A'}`);
        console.log(`Número de registros: ${overview.NumberOfRecords || '0'}`);
        
        if (overview.Details) {
          const details = overview.Details;
          console.log('\n--- Detalhes ---');
          console.log(`Registro: ${details.RecordNumber || 'N/A'}`);
          console.log(`Valor: ${formatCurrency(details.Amount || 0, label)}`);
          console.log(`Moeda: ${details.Currency || label}`);
          console.log(`Conta: ${details.AccountName || 'N/A'}`);
          
          if (details.Res_code) {
            console.log(`\n⚠️ CÓDIGO DA RESERVA: ${details.Res_code}`);
            console.log('⚠️ ESTE CÓDIGO É NECESSÁRIO PARA CONFIRMAÇÃO');
          }
        }
      }
    } catch (jsonError) {
      console.log('Dados (não puderam ser formatados como JSON):');
      console.log(data);
    }
    
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
  console.log('🏦 VERIFICAÇÃO NO AMBIENTE DE TESTE');
  console.log('===========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log('===========================================');
  
  // Testar URL USD
  console.log('\n📝 VERIFICANDO CONTA USD...');
  await testUrl(USD_URL, 'USD');
  
  // Testar URL EUR
  console.log('\n📝 VERIFICANDO CONTA EUR...');
  await testUrl(EUR_URL, 'EUR');
  
  // Testar URL de recebimento
  console.log('\n📝 VERIFICANDO RECEBIMENTOS...');
  await testUrl(RECEIVING_URL, 'Recebimentos');
  
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
main();
