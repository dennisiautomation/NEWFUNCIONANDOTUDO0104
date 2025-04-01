/**
 * Script para monitorar transferências e confirmar automaticamente
 * quando a transferência de 1 milhão de USD estiver disponível
 */
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração para produção
const BASE_URL = process.env.FT_API_BASE_URL || 'https://my.ftassetmanagement.com/api';
const API_KEY = process.env.FT_API_KEY || '36bd30d0-f685-11ef-a3af-00155d010b18';
const USD_ACCOUNT = process.env.USD_ACCOUNT || '60248';
const EUR_ACCOUNT = process.env.EUR_ACCOUNT || '60429';

// URLs de produção
const USD_RESERVATION_URL = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${USD_ACCOUNT}`;
const EUR_RESERVATION_URL = `${BASE_URL}/reservation.asp?key=${API_KEY}&account=${EUR_ACCOUNT}`;
const CONFIRMATION_URL = `${BASE_URL}/reservation_confirmation.asp`;

// Diretório de logs
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Arquivo de log
const LOG_FILE = path.join(LOG_DIR, 'monitor-transferencias.log');

/**
 * Registra uma mensagem no log
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Adicionar ao arquivo de log
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

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
async function makeRequest(url, method = 'GET', data = null) {
  log(`Fazendo requisição ${method} para: ${url}`);
  
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(url);
    } else if (method === 'POST') {
      response = await axios.post(url, data);
    }
    
    log(`Resposta: ${response.status} ${response.statusText}`);
    
    // Verificar se é JSON válido
    let responseData = response.data;
    try {
      if (typeof responseData === 'string') {
        // Corrigir qualquer problema de formatação JSON
        responseData = responseData.replace(/,(\s*})/g, '$1');
        responseData = JSON.parse(responseData);
      }
      
      log(`Dados da resposta: ${JSON.stringify(responseData)}`);
      
      return responseData;
    } catch (jsonError) {
      log(`Dados da resposta (não puderam ser formatados como JSON): ${responseData}`);
      return responseData;
    }
  } catch (error) {
    log(`Erro: ${error.message}`, 'ERROR');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'ERROR');
      log(`Dados: ${JSON.stringify(error.response.data)}`, 'ERROR');
    }
    return null;
  }
}

/**
 * Verifica se a transferência é a de 1 milhão de USD
 */
function isMillionDollarTransfer(reservationDetails) {
  if (!reservationDetails) return false;
  
  // Verificar se o valor é próximo de 1 milhão (pode haver pequenas variações)
  const amount = parseFloat(reservationDetails.Amount);
  return amount >= 990000 && amount <= 1010000;
}

/**
 * Confirma uma reserva
 */
async function confirmReservation(resCode, accountNumber, amount) {
  log(`Confirmando reserva: ${resCode} para conta ${accountNumber} no valor de ${formatCurrency(amount)}`, 'IMPORTANT');
  
  const confirmationData = {
    "Reservation_confirmation v0.9": {
      "Details": {
        "authToken": API_KEY,
        "Res_code": resCode,
        "DateTime": new Date().toISOString(),
        "AccountNumber": accountNumber,
        "Amount": amount.toString()
      }
    }
  };
  
  // Registrar a tentativa de confirmação
  log(`Dados de confirmação: ${JSON.stringify(confirmationData)}`, 'IMPORTANT');
  
  // Fazer a requisição de confirmação
  const result = await makeRequest(CONFIRMATION_URL, 'POST', confirmationData);
  
  if (result) {
    log(`Confirmação bem-sucedida: ${JSON.stringify(result)}`, 'SUCCESS');
    return true;
  } else {
    log('Falha na confirmação', 'ERROR');
    return false;
  }
}

/**
 * Verifica reservas pendentes
 */
async function checkReservations() {
  log('Verificando reservas pendentes...');
  
  // Verificar reservas USD
  log('Verificando conta USD...');
  const usdResult = await makeRequest(USD_RESERVATION_URL);
  
  if (usdResult && usdResult.ReservationsOverview) {
    const overview = usdResult.ReservationsOverview;
    
    if (overview.Details && overview.Details.Res_code) {
      log(`Encontrada reserva USD: ${JSON.stringify(overview.Details)}`, 'IMPORTANT');
      
      // Verificar se é a transferência de 1 milhão
      if (isMillionDollarTransfer(overview.Details)) {
        log('ENCONTRADA TRANSFERÊNCIA DE 1 MILHÃO DE USD!', 'IMPORTANT');
        
        // Confirmar a reserva
        await confirmReservation(
          overview.Details.Res_code,
          USD_ACCOUNT,
          parseFloat(overview.Details.Amount)
        );
      } else {
        log(`Transferência encontrada, mas não é a de 1 milhão: ${overview.Details.Amount}`, 'WARNING');
      }
    }
  } else if (usdResult && usdResult.Information) {
    log(`Informação USD: ${usdResult.Information.Info}`);
  }
  
  // Verificar reservas EUR
  log('Verificando conta EUR...');
  const eurResult = await makeRequest(EUR_RESERVATION_URL);
  
  if (eurResult && eurResult.ReservationsOverview) {
    const overview = eurResult.ReservationsOverview;
    
    if (overview.Details && overview.Details.Res_code) {
      log(`Encontrada reserva EUR: ${JSON.stringify(overview.Details)}`, 'IMPORTANT');
    }
  } else if (eurResult && eurResult.Information) {
    log(`Informação EUR: ${eurResult.Information.Info}`);
  }
}

/**
 * Função principal
 */
async function main() {
  log('===========================================');
  log(' MONITOR DE TRANSFERÊNCIAS INICIADO');
  log('===========================================');
  log(`Base URL: ${BASE_URL}`);
  log(`Conta USD: ${USD_ACCOUNT}`);
  log(`Conta EUR: ${EUR_ACCOUNT}`);
  log('===========================================');
  
  // Verificar reservas imediatamente
  await checkReservations();
  
  // Configurar verificação periódica a cada 5 minutos
  log('Configurando verificação periódica a cada 5 minutos...');
  
  setInterval(async () => {
    log(`\n=== Verificação periódica: ${new Date().toLocaleString()} ===`);
    await checkReservations();
  }, 5 * 60 * 1000); // 5 minutos
}

// Iniciar o monitor
main().catch(error => {
  log(`Erro fatal: ${error.message}`, 'ERROR');
});
