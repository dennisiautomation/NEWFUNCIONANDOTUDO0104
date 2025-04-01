/**
 * Script de diagnóstico para o NewCash Bank System
 * Este script verifica cada componente necessário para iniciar o servidor
 */
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('======= DIAGNÓSTICO DO NEWCASH BANK SYSTEM =======');
console.log('Data/Hora:', new Date().toLocaleString());
console.log('\n1. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido (usando development)');
console.log('PORT:', process.env.PORT || 'não definido (usando 5000)');
console.log('FT_API_BASE_URL:', process.env.FT_API_BASE_URL || 'não definido');
console.log('FT_API_KEY:', process.env.FT_API_KEY ? '***DEFINIDO***' : 'não definido');
console.log('USD_ACCOUNT:', process.env.USD_ACCOUNT || 'não definido');
console.log('EUR_ACCOUNT:', process.env.EUR_ACCOUNT || 'não definido');

console.log('\n2. VERIFICANDO MÓDULOS:');
const modules = [
  'express', 'cors', 'helmet', 'morgan', 'dotenv', 'express-rate-limit', 
  'path', './services/logger.service', './middleware/api-logger.middleware'
];

for (const module of modules) {
  try {
    require(module);
    console.log(`✅ Módulo '${module}' carregado com sucesso`);
  } catch (error) {
    console.error(`❌ ERRO ao carregar módulo '${module}':`, error.message);
  }
}

console.log('\n3. VERIFICANDO ARQUIVOS DE ROTAS:');
const routes = [
  './routes/auth.routes',
  './routes/user.routes',
  './routes/account.routes',
  './routes/transaction.routes',
  './routes/reservation.routes',
  './routes/ftApi.routes',
  './routes/admin.routes',
  './routes/security.routes'
];

for (const route of routes) {
  try {
    require(route);
    console.log(`✅ Rota '${route}' carregada com sucesso`);
  } catch (error) {
    console.error(`❌ ERRO ao carregar rota '${route}':`, error.message);
  }
}

console.log('\n4. VERIFICANDO SERVIÇO FT API:');
try {
  const ftApiService = require('./services/ftApi.service');
  console.log('✅ Serviço FT API carregado com sucesso');
  console.log('   Base URL:', ftApiService.baseUrl);
  console.log('   API Key:', ftApiService.apiKey ? '***DEFINIDO***' : 'não definido');
  console.log('   Conta USD:', ftApiService.usdAccount);
  console.log('   Conta EUR:', ftApiService.eurAccount);
} catch (error) {
  console.error('❌ ERRO ao carregar serviço FT API:', error.message);
}

console.log('\n======= DIAGNÓSTICO CONCLUÍDO =======');
