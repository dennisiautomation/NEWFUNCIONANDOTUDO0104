/**
 * Script para verificar o histórico de transações da API FT
 * URL: https://my.ftassetmanagement.com/api
 * Contas: 60428 (USD) e 60429 (EUR)
 */
const axios = require('axios');

// Configuração para produção
const BASE_URL = 'https://my.ftassetmanagement.com/api';
const API_KEY = '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

// Tentar diferentes variações de endpoints para histórico
const ENDPOINTS = [
  '/history.asp',          // Formato padrão
  '/transactions.asp',     // Nome alternativo comum
  '/statement.asp',        // Outro nome comum para histórico
  '/ledger.asp',           // Outro nome possível
  '/reservation_history.asp', // Histórico específico de reservas
  '/account_history.asp'   // Histórico específico de conta
];

// Parâmetros extras que podemos tentar
const EXTRA_PARAMS = [
  {},  // Sem parâmetros extras
  { dateFrom: '2025-01-01', dateTo: '2025-03-06' },  // Data específica
  { days: '90' },  // Últimos X dias
  { status: 'completed' },  // Só transações concluídas
  { type: 'all' }  // Todos os tipos
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
      
      // Extrair informações sobre transações se disponíveis
      if (data && Array.isArray(data)) {
        console.log(`\n=== ${data.length} TRANSAÇÕES ENCONTRADAS ===`);
      } else if (data && typeof data === 'object') {
        console.log('\n=== ANÁLISE DE RESPOSTA ===');
        Object.keys(data).forEach(key => {
          console.log(`Chave: ${key}, Tipo: ${typeof data[key]}`);
          
          // Se for um objeto ou array, mostrar mais detalhes
          if (typeof data[key] === 'object' && data[key] !== null) {
            if (Array.isArray(data[key])) {
              console.log(`  - Array com ${data[key].length} itens`);
            } else {
              console.log(`  - Objeto com chaves: ${Object.keys(data[key]).join(', ')}`);
            }
          }
        });
      }
      
      return true;
    } catch (jsonError) {
      console.log('Dados (não puderam ser formatados como JSON):');
      console.log(data);
      
      // Verifique se os dados contêm algo que parece uma transação
      if (typeof data === 'string' && 
          (data.includes('transaction') || 
           data.includes('transfer') || 
           data.includes('1000000') || 
           data.includes('1,000,000'))) {
        console.log('\n⚠️ POSSÍVEL MENÇÃO A TRANSAÇÃO DETECTADA NO TEXTO');
      }
      
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`❌ Endpoint não encontrado (404)`);
    } else {
      console.error(`❌ Erro: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
      }
    }
    return false;
  }
}

/**
 * Tenta verificar o histórico de uma conta usando diferentes endpoints e parâmetros
 */
async function verificarHistoricoConta(account, label) {
  console.log(`\n==========================================`);
  console.log(`🔎 VERIFICANDO HISTÓRICO DA CONTA ${label}: ${account}`);
  console.log(`==========================================`);
  
  let sucesso = false;
  
  // Verificar endpoint de reserva normal primeiro
  console.log("\n📊 Verificando endpoint de reserva padrão:");
  const reservaUrl = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${account}`;
  await testUrl(reservaUrl, `${label} (Reservas)`);
  
  // Tentar endpoints específicos para histórico
  for (const endpoint of ENDPOINTS) {
    for (const params of EXTRA_PARAMS) {
      // Construir URL com parâmetros
      let url = `${BASE_URL}${endpoint}?key=${API_KEY}&account=${account}`;
      
      // Adicionar parâmetros extras
      Object.entries(params).forEach(([key, value]) => {
        url += `&${key}=${value}`;
      });
      
      // Testar URL
      const resultado = await testUrl(url, `${label} (${endpoint})`);
      if (resultado) {
        sucesso = true;
      }
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Tentar endpoint receiving
  console.log("\n📊 Verificando endpoint de recebimento:");
  const receivingUrl = `${BASE_URL}/receiving.asp?key=${API_KEY}&account=${account}`;
  await testUrl(receivingUrl, `${label} (Recebimento)`);
  
  if (!sucesso) {
    console.log(`\n⚠️ Nenhum endpoint de histórico funcionou para a conta ${account} (${label})`);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('===========================================');
  console.log('🏦 VERIFICAÇÃO DE HISTÓRICO DE TRANSAÇÕES');
  console.log('===========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log('===========================================');
  
  // Tenta usar os métodos oficiais de recebimento primeiro
  console.log('\n📝 VERIFICANDO RECEBIMENTOS GLOBAIS...');
  await testUrl(`${BASE_URL}/receiving.asp?key=${API_KEY}`, 'Recebimentos Globais');
  
  // Verificar histórico da conta USD
  await verificarHistoricoConta(USD_ACCOUNT, 'USD');
  
  // Verificar histórico da conta EUR
  await verificarHistoricoConta(EUR_ACCOUNT, 'EUR');
  
  console.log('\n✅ Verificação concluída');
  console.log('===========================================');
}

// Executar
main();
