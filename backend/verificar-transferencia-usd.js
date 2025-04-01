/**
 * Script para verificar a transferência de 1 milhão de USD na conta 60428
 * Este é um script seguro que apenas exibe informações, sem confirmar nenhuma transferência.
 */
const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// API config (valores fixos em vez de depender do .env para garantir)
const BASE_URL = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const API_KEY = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

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
 * Realiza a requisição à API
 */
async function makeRequest(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Verificando: ${url}`);
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`❌ Erro na requisição: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(error.response.data);
    }
    return null;
  }
}

/**
 * Processa e exibe reservas
 */
function processReservations(data, accountType) {
  if (!data) {
    console.log(`❌ Sem dados para conta ${accountType}`);
    return;
  }
  
  try {
    // Corrigir JSON inválido se necessário
    let jsonStr = data;
    if (typeof data === 'string') {
      // Substituir vírgula antes de fechamento de chave
      jsonStr = data.replace(/,(\s*})/g, '$1');
    }
    
    // Tentar parse do JSON corrigido
    let reservations;
    try {
      reservations = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    } catch (parseError) {
      console.log(`⚠️ Formato JSON inválido, exibindo resposta bruta:`);
      console.log(data);
      return;
    }
    
    console.log(`\n===== RESERVAS ${accountType} =====`);
    
    // Verificar se há informações ou transações
    if (reservations.Information && reservations.Information.Info) {
      console.log(`ℹ️ ${reservations.Information.Info}`);
      return;
    }

    // Normalmente os dados das reservas vêm no formato:
    // "ReservationsOverview 0.9" ou outro formato
    // Verificar estrutura para determinar onde estão os dados
    if (reservations["ReservationsOverview 0.9"]) {
      const overview = reservations["ReservationsOverview 0.9"];
      console.log(`📄 Nome: ${overview.Name || 'N/A'}`);
      console.log(`📄 País: ${overview.Country || 'N/A'}`);
      console.log(`📄 Website: ${overview.Website || 'N/A'}`);
      console.log(`📄 Número de registros: ${overview.NumberOfRecords || '0'}`);
      
      // Verificar se há detalhes
      if (overview.Details) {
        const details = overview.Details;
        console.log('\n----- DETALHES DA TRANSFERÊNCIA -----');
        console.log(`🔢 Registro: ${details.RecordNumber || 'N/A'}`);
        console.log(`💰 Valor: ${formatCurrency(details.Amount || 0, accountType)}`);
        console.log(`📝 Moeda: ${details.Currency || accountType}`);
        console.log(`👤 Conta: ${details.AccountName || 'N/A'}`);
        console.log(`✍️ Signatário: ${details.AccountSignatory || 'N/A'}`);
        
        // Armazenar o código da reserva para possível confirmação
        if (details.Res_code) {
          console.log(`\n🔑 CÓDIGO DA RESERVA: ${details.Res_code}`);
          console.log('⚠️ GUARDE ESTE CÓDIGO PARA CONFIRMAÇÃO ⚠️');
        }
      }
    } else if (reservations.Transactions && reservations.Transactions.length > 0) {
      // Formato alternativo: lista de transações
      console.log(`Encontradas ${reservations.Transactions.length} transações`);
      
      reservations.Transactions.forEach((transaction, index) => {
        console.log(`\n----- TRANSAÇÃO #${index + 1} -----`);
        Object.entries(transaction).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      });
    } else {
      // Se não conseguir identificar o formato, mostra os dados brutos
      console.log('Estrutura de dados não reconhecida:');
      console.log(JSON.stringify(reservations, null, 2));
    }
  } catch (error) {
    console.error(`❌ Erro ao processar reservas ${accountType}: ${error.message}`);
    console.log('Dados recebidos:', data);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('============================================');
  console.log('🔍 VERIFICADOR DE TRANSFERÊNCIAS - SOMENTE LEITURA');
  console.log('============================================');
  console.log('⚠️  ESTE SCRIPT APENAS VISUALIZA AS RESERVAS ⚠️');
  console.log('⚠️  NÃO CONFIRMA NENHUMA TRANSFERÊNCIA    ⚠️');
  console.log('============================================');
  console.log(`URL Base: ${BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log('============================================');
  console.log();

  // Verificar reservas USD
  console.log('🔍 Verificando transferência de 1 milhão USD...');
  const usdData = await makeRequest(`/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`);
  processReservations(usdData, 'USD');

  // Verificar reservas EUR
  console.log('\n🔍 Verificando reservas EUR...');
  const eurData = await makeRequest(`/reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`);
  processReservations(eurData, 'EUR');

  console.log('\n✅ Verificação concluída com sucesso!');
  console.log('============================================');
  console.log('Para confirmar reservas, use o modelo de confirmação POST:');
  console.log('URL: https://my.ftassetmanagement.com/api/reservation_confirmation.asp');
  console.log('Método: POST');
  console.log('Dados (JSON):');
  console.log(`{
  "Reservation_confirmation v0.9": {
    "Details": {
      "authToken": "${API_KEY}",
      "Res_code": "CÓDIGO_DA_RESERVA",
      "DateTime": "${new Date().toISOString()}",
      "AccountNumber": "${USD_ACCOUNT}",
      "Amount": "VALOR_DA_TRANSFERÊNCIA"
    }
  }
}`);
  console.log('============================================');
}

// Executar a função principal
main();
