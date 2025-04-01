/**
 * Visualizador de Reservas - NewCash Bank System
 * 
 * SOMENTE VISUALIZAÇÃO - NÃO CONFIRMA NENHUMA TRANSFERÊNCIA
 * SEGURO PARA AMBIENTE DE PRODUÇÃO
 * 
 * Este script verifica se existem reservas pendentes nas contas USD e EUR,
 * mas não realiza nenhuma confirmação ou modificação.
 */
require('dotenv').config();
const axios = require('axios');

// Configurações da API
const BASE_URL = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const API_KEY = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = process.env.USD_ACCOUNT || '60428';
const EUR_ACCOUNT = process.env.EUR_ACCOUNT || '60429';

console.log('============================================');
console.log('🔍 VISUALIZADOR DE RESERVAS - SOMENTE LEITURA');
console.log('============================================');
console.log('⚠️  ESTE SCRIPT APENAS VISUALIZA AS RESERVAS ⚠️');
console.log('⚠️  NÃO CONFIRMA NENHUMA TRANSFERÊNCIA    ⚠️');
console.log('============================================');
console.log('URL Base:', BASE_URL);
console.log('Conta USD:', USD_ACCOUNT);
console.log('Conta EUR:', EUR_ACCOUNT);
console.log('Data/Hora:', new Date().toLocaleString());
console.log('============================================\n');

/**
 * Função para realizar requisições de forma segura
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
      console.error(`Status: ${error.response.status}`);
    }
    return null;
  }
}

/**
 * Formata valor monetário
 */
function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
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
    // Corrigir JSON inválido da API FT, que inclui vírgula após último elemento
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
    
    // Verificar se há transações
    if (reservations.Transactions && reservations.Transactions.length > 0) {
      console.log(`🔔 ENCONTRADAS ${reservations.Transactions.length} TRANSAÇÕES PENDENTES!\n`);
      
      reservations.Transactions.forEach((transaction, index) => {
        console.log(`📝 Transação #${index + 1}:`);
        console.log(`   ID: ${transaction.id || 'N/A'}`);
        console.log(`   Referência: ${transaction.reference || 'N/A'}`);
        console.log(`   Valor: ${formatMoney(transaction.amount || 0)}`);
        console.log(`   De: ${transaction.sender || 'N/A'}`);
        console.log(`   Para: ${transaction.recipient || 'N/A'}`);
        console.log(`   Data: ${transaction.date || 'N/A'}`);
        console.log(`   Status: ${transaction.status || 'pendente'}`);
        console.log(`   Descrição: ${transaction.description || 'N/A'}`);
        console.log('');
      });
      
      console.log('⚠️ IMPORTANTE: Para confirmar estas transações, use o painel de administração.');
      console.log('⚠️ Este script NÃO realiza confirmações automáticas por segurança.');
    } else {
      console.log('✅ Nenhuma transação pendente encontrada.');
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
  try {
    // Verificar reservas USD
    console.log('\n🔍 Verificando reservas USD...');
    const usdData = await makeRequest(`/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`);
    processReservations(usdData, 'USD');
    
    // Verificar reservas EUR
    console.log('\n🔍 Verificando reservas EUR...');
    const eurData = await makeRequest(`/reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`);
    processReservations(eurData, 'EUR');

    console.log('\n✅ Verificação concluída com sucesso!');
    console.log('============================================');
    console.log('Para confirmar reservas, utilize o sistema administrativo');
    console.log('com as validações e aprovações necessárias.');
    console.log('============================================');
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  }
}

// Executar o script
main();
