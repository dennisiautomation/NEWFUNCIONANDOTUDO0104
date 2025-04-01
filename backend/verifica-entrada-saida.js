/**
 * Script para verificar entradas e saídas das contas FT
 * Focado em encontrar a transferência de 1 milhão USD
 */
const axios = require('axios');

// Configuração para produção
const BASE_URL = 'https://my.ftassetmanagement.com/api';
const API_KEY = '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

// Formatar moeda
function formatarMoeda(valor, moeda = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moeda
  }).format(valor);
}

// Realizar requisição para a API
async function fazerRequisicao(url, descricao) {
  console.log(`\n🔍 Verificando ${descricao}: ${url}`);
  
  try {
    const response = await axios.get(url);
    console.log(`✅ Resposta: ${response.status} ${response.statusText}`);
    
    let dados = response.data;
    
    // Tentar formatar como JSON se for string
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados.replace(/,(\s*})/g, '$1'));
      } catch (e) {
        // Se não for JSON válido, mantém como string
      }
    }
    
    // Exibir dados formatados
    console.log('Resposta da API:');
    console.log(typeof dados === 'object' ? JSON.stringify(dados, null, 2) : dados);
    
    // Verificar se há menção a 1 milhão
    const conteudoTexto = JSON.stringify(dados);
    if (conteudoTexto.includes('1000000') || 
        conteudoTexto.includes('1,000,000') || 
        conteudoTexto.includes('1.000.000') || 
        conteudoTexto.includes('1 000 000') ||
        conteudoTexto.includes('1m') ||
        conteudoTexto.includes('1M')) {
      console.log('\n🚨 ATENÇÃO: POSSÍVEL TRANSFERÊNCIA DE 1 MILHÃO DETECTADA!');
    }
    
    return dados;
  } catch (erro) {
    console.error(`❌ Erro: ${erro.message}`);
    if (erro.response) {
      console.log(`Status: ${erro.response.status}`);
      console.log(erro.response.data);
    }
    return null;
  }
}

// Verificar reservas pendentes
async function verificarReservas(conta, moeda) {
  console.log(`\n=========================================`);
  console.log(`📥 VERIFICANDO RESERVAS NA CONTA ${moeda}: ${conta}`);
  console.log(`=========================================`);
  
  const url = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${conta}`;
  await fazerRequisicao(url, `Reservas ${moeda}`);
}

// Verificar transações recebidas
async function verificarRecebimentos() {
  console.log(`\n=========================================`);
  console.log(`📥 VERIFICANDO RECEBIMENTOS GLOBAIS`);
  console.log(`=========================================`);
  
  const url = `${BASE_URL}/receiving.asp?key=${API_KEY}`;
  await fazerRequisicao(url, 'Recebimentos Globais');
  
  // Tentar com conta específica
  console.log(`\n📊 Tentando verificar recebimentos com conta específica:`);
  const urlUsd = `${BASE_URL}/receiving.asp?key=${API_KEY}&account=${USD_ACCOUNT}`;
  await fazerRequisicao(urlUsd, `Recebimentos USD`);
}

// Verificar transações enviadas (tentativa)
async function verificarEnvios() {
  console.log(`\n=========================================`);
  console.log(`📤 VERIFICANDO ENVIOS`);
  console.log(`=========================================`);
  
  // Tentar diferentes endpoints comuns para envios
  const endpoints = [
    '/sending.asp',
    '/outgoing.asp',
    '/transfer.asp',
    '/sent.asp'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}?key=${API_KEY}`;
    await fazerRequisicao(url, `Envios (${endpoint})`);
  }
}

// Função principal
async function main() {
  console.log('===========================================');
  console.log('🔍 VERIFICAÇÃO DE ENTRADAS E SAÍDAS');
  console.log('===========================================');
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log(`API Base: ${BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log('===========================================');
  
  // Verificar reservas nas contas
  await verificarReservas(USD_ACCOUNT, 'USD');
  await verificarReservas(EUR_ACCOUNT, 'EUR');
  
  // Verificar recebimentos
  await verificarRecebimentos();
  
  // Verificar envios
  await verificarEnvios();
  
  console.log('\n✅ Verificação concluída');
}

// Executar
main().catch(erro => {
  console.error('Erro na execução do script:', erro);
});
