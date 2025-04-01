/**
 * Script para preparar uma transferência de 1 dólar
 * ATENÇÃO: Este script prepara a requisição mas NÃO a executa automaticamente
 */
const axios = require('axios');
const readline = require('readline');

// Configuração para produção
const BASE_URL = 'https://my.ftassetmanagement.com/api';
const API_KEY = '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = '60428';
const EUR_ACCOUNT = '60429';

// Interface para leitura de input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Faz requisição para uma URL
 */
async function fazerRequisicao(url, metodo = 'GET', dados = null) {
  console.log(`\n🔍 Fazendo requisição ${metodo} para: ${url}`);
  if (dados) {
    console.log('Dados:', JSON.stringify(dados, null, 2));
  }
  
  try {
    let response;
    if (metodo === 'GET') {
      response = await axios.get(url);
    } else if (metodo === 'POST') {
      response = await axios.post(url, dados);
    }
    
    console.log(`✅ Resposta: ${response.status} ${response.statusText}`);
    
    // Verificar se é JSON válido
    let responseData = response.data;
    try {
      if (typeof responseData === 'string') {
        responseData = JSON.parse(responseData.replace(/,(\s*})/g, '$1'));
      }
      
      console.log('Dados da resposta (formatados):');
      console.log(JSON.stringify(responseData, null, 2));
    } catch (jsonError) {
      console.log('Dados da resposta (não puderam ser formatados como JSON):');
      console.log(responseData);
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
 * Prepara uma transferência de 1 dólar
 */
async function prepararTransferencia() {
  console.log('===========================================');
  console.log('💸 PREPARAÇÃO DE TRANSFERÊNCIA DE 1 DÓLAR');
  console.log('===========================================');
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log(`API Base: ${BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log('===========================================');
  
  // Dados da transferência
  const dadosTransferencia = {
    "Transfer": {
      "Details": {
        "authToken": API_KEY,
        "FromAccount": USD_ACCOUNT,
        "ToAccount": "CONTA_DESTINO", // Será solicitado ao usuário
        "Amount": "1.00",
        "Currency": "USD",
        "Reference": "Teste de transferência de 1 dólar",
        "DateTime": new Date().toISOString()
      }
    }
  };
  
  // Solicitar conta de destino
  rl.question('\n📝 Digite a conta de destino para a transferência: ', async (contaDestino) => {
    dadosTransferencia.Transfer.Details.ToAccount = contaDestino;
    
    console.log('\n📋 Dados da transferência preparados:');
    console.log(JSON.stringify(dadosTransferencia, null, 2));
    
    // Confirmar execução
    rl.question('\n⚠️ Deseja realmente executar esta transferência? (sim/não): ', async (resposta) => {
      if (resposta.toLowerCase() === 'sim') {
        console.log('\n🚀 Executando transferência...');
        
        // Tentar diferentes endpoints possíveis para transferência
        const endpoints = [
          '/transfer.asp',
          '/send.asp',
          '/transaction.asp'
        ];
        
        let sucesso = false;
        
        for (const endpoint of endpoints) {
          console.log(`\n🔍 Tentando endpoint: ${endpoint}`);
          const url = `${BASE_URL}${endpoint}`;
          const resultado = await fazerRequisicao(url, 'POST', dadosTransferencia);
          
          if (resultado) {
            sucesso = true;
            break;
          }
        }
        
        if (!sucesso) {
          console.log('\n❌ Nenhum dos endpoints funcionou para transferência.');
          console.log('Tente verificar a documentação da API para o endpoint correto.');
        }
      } else {
        console.log('\n🛑 Transferência cancelada pelo usuário.');
      }
      
      rl.close();
    });
  });
}

// Verificar reservas antes de tentar transferência
async function verificarReservas() {
  console.log('\n📝 Verificando reservas pendentes antes de prosseguir...');
  
  const url = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`;
  const resultado = await fazerRequisicao(url);
  
  if (resultado && resultado.Information && resultado.Information.Info === "No new transactions available") {
    console.log('\n✅ Não há reservas pendentes. Podemos prosseguir com a transferência.');
    prepararTransferencia();
  } else if (resultado && resultado.ReservationsOverview) {
    console.log('\n⚠️ Há reservas pendentes. Verifique antes de prosseguir.');
    rl.close();
  } else {
    console.log('\n⚠️ Resposta inesperada da API. Verifique antes de prosseguir.');
    console.log('Vamos tentar prosseguir mesmo assim...');
    prepararTransferencia();
  }
}

// Iniciar o processo
verificarReservas();
