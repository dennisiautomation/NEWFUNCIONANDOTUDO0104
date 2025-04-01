/**
 * Script para verificar o saldo atual das contas FT
 */
const axios = require('axios');

// Configuração para produção
const BASE_URL = 'https://my.ftassetmanagement.com/api';
const API_KEY = '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

// Possíveis endpoints para verificar saldo
const ENDPOINTS = [
  '/balance.asp',
  '/account_balance.asp',
  '/statement.asp',
  '/account.asp'
];

// Formatar moeda
function formatarMoeda(valor, moeda = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moeda
  }).format(valor);
}

// Realizar requisição para a API
async function verificarEndpoint(endpoint, conta, moeda) {
  const url = `${BASE_URL}${endpoint}?key=${API_KEY}&account=${conta}`;
  console.log(`\n🔍 Verificando saldo via ${endpoint}: ${url}`);
  
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
    
    // Tentar extrair saldo do JSON
    if (typeof dados === 'object') {
      console.log('\n📊 Tentando identificar saldo nas informações retornadas:');
      
      // Verificar padrões comuns para saldo
      const camposComuns = ['balance', 'amount', 'value', 'saldo', 'total', 'available'];
      const todosCampos = encontrarTodosCampos(dados);
      
      console.log('Campos encontrados:', todosCampos);
      
      for (const campo of camposComuns) {
        for (const encontrado of todosCampos) {
          if (encontrado.toLowerCase().includes(campo)) {
            console.log(`Campo relacionado ao saldo encontrado: ${encontrado}`);
            let valor = obterValorCampo(dados, encontrado);
            if (valor !== undefined) {
              console.log(`Valor: ${typeof valor === 'number' ? formatarMoeda(valor, moeda) : valor}`);
            }
          }
        }
      }
    }
    
    return dados;
  } catch (erro) {
    if (erro.response && erro.response.status === 404) {
      console.log(`❌ Endpoint não encontrado (404)`);
    } else {
      console.error(`❌ Erro: ${erro.message}`);
      if (erro.response) {
        console.log(`Status: ${erro.response.status}`);
      }
    }
    return null;
  }
}

// Função para encontrar todos os campos em um objeto JSON (recursivamente)
function encontrarTodosCampos(obj, prefixo = '') {
  let campos = [];
  
  if (typeof obj !== 'object' || obj === null) {
    return campos;
  }
  
  for (const chave in obj) {
    const caminhoCompleto = prefixo ? `${prefixo}.${chave}` : chave;
    campos.push(caminhoCompleto);
    
    if (typeof obj[chave] === 'object' && obj[chave] !== null) {
      campos = campos.concat(encontrarTodosCampos(obj[chave], caminhoCompleto));
    }
  }
  
  return campos;
}

// Função para obter o valor de um campo a partir do caminho
function obterValorCampo(obj, caminho) {
  const partes = caminho.split('.');
  let valor = obj;
  
  for (const parte of partes) {
    if (valor === undefined || valor === null) {
      return undefined;
    }
    valor = valor[parte];
  }
  
  return valor;
}

// Verificar saldo de uma conta
async function verificarSaldoConta(conta, moeda) {
  console.log(`\n=========================================`);
  console.log(`💰 VERIFICANDO SALDO DA CONTA ${moeda}: ${conta}`);
  console.log(`=========================================`);
  
  // Tentar manualmente o endpoint info/saldo
  await verificarEndpoint('/info.asp', conta, moeda);
  
  // Tentar todos os endpoints possíveis para saldo
  for (const endpoint of ENDPOINTS) {
    await verificarEndpoint(endpoint, conta, moeda);
  }
  
  // Se nenhum dos endpoints funcionar, tentar o de reservas
  // (que sabemos que funciona) para ver se retorna informações de saldo
  console.log('\n🔍 Tentando obter informações através do endpoint de reservas:');
  const reservaUrl = `/reservation.asp`;
  await verificarEndpoint(reservaUrl, conta, moeda);
}

// Função principal
async function main() {
  console.log('===========================================');
  console.log('💰 VERIFICAÇÃO DE SALDOS');
  console.log('===========================================');
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log(`API Base: ${BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log('===========================================');
  
  // Verificar saldo das contas
  await verificarSaldoConta(USD_ACCOUNT, 'USD');
  await verificarSaldoConta(EUR_ACCOUNT, 'EUR');
  
  console.log('\n✅ Verificação concluída');
}

// Executar
main().catch(erro => {
  console.error('Erro na execução do script:', erro);
});
