/**
 * Script para iniciar o sistema NewCash Bank em produção
 * Este script lida com problemas de conexão com MongoDB e inicia o servidor
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Configurações
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newcash-bank';
const MONGODB_OFFLINE_MODE = process.env.MONGODB_OFFLINE_MODE === 'true';
const FT_API_BASE_URL = process.env.FT_API_BASE_URL;
const USD_ACCOUNT = process.env.USD_ACCOUNT;
const EUR_ACCOUNT = process.env.EUR_ACCOUNT;

// Função para verificar a conexão com o MongoDB
async function checkMongoDBConnection() {
  if (MONGODB_OFFLINE_MODE) {
    console.log('⚠️ Modo offline ativado. Ignorando verificação de conexão com MongoDB.');
    return true;
  }
  
  console.log(`🔄 Verificando conexão com MongoDB: ${MONGODB_URI}`);
  
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    console.log('✅ Conexão com MongoDB estabelecida com sucesso!');
    
    // Verificar se o banco de dados existe
    const dbList = await client.db().admin().listDatabases();
    const dbExists = dbList.databases.some(db => db.name === 'newcash-bank');
    
    if (!dbExists) {
      console.log('⚠️ Banco de dados "newcash-bank" não encontrado. Será criado automaticamente.');
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão com MongoDB:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('⚠️ MongoDB não está em execução ou não está acessível no endereço configurado.');
      console.error('⚠️ Verifique se o MongoDB está instalado e em execução.');
      
      // Tentar iniciar o MongoDB automaticamente
      console.log('🔄 Tentando iniciar o MongoDB automaticamente...');
      
      try {
        // Verificar se estamos em ambiente Linux/Unix
        if (process.platform !== 'win32') {
          spawn('systemctl', ['start', 'mongod'], { stdio: 'inherit' });
          console.log('🔄 Comando enviado para iniciar o MongoDB. Aguardando 5 segundos...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Tentar conectar novamente
          return await checkMongoDBConnection();
        } else {
          console.error('❌ Não foi possível iniciar o MongoDB automaticamente em ambiente Windows.');
        }
      } catch (startError) {
        console.error('❌ Falha ao tentar iniciar o MongoDB:', startError.message);
      }
    }
    
    // Perguntar se deseja continuar em modo offline
    console.log('⚠️ Deseja continuar em modo offline? O sistema funcionará com dados simulados.');
    process.env.MONGODB_OFFLINE_MODE = 'true';
    
    return false;
  }
}

// Função para iniciar o servidor
async function startServer() {
  console.log('===========================================');
  console.log('🚀 INICIANDO NEWCASH BANK SYSTEM EM PRODUÇÃO');
  console.log('===========================================');
  console.log(`Porta: ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
  console.log(`Modo Offline: ${MONGODB_OFFLINE_MODE ? 'Ativado' : 'Desativado'}`);
  console.log(`FT API Base URL: ${FT_API_BASE_URL}`);
  console.log(`Conta USD: ${USD_ACCOUNT}`);
  console.log(`Conta EUR: ${EUR_ACCOUNT}`);
  console.log(`Data/Hora: ${new Date().toLocaleString()}`);
  console.log('===========================================');
  
  // Verificar conexão com MongoDB
  const mongoConnected = await checkMongoDBConnection();
  
  if (!mongoConnected && !MONGODB_OFFLINE_MODE) {
    console.error('❌ Não foi possível conectar ao MongoDB e o modo offline não está ativado.');
    console.error('❌ Encerrando o sistema. Verifique a configuração do MongoDB e tente novamente.');
    process.exit(1);
  }
  
  // Verificar se o diretório de logs existe
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log('✅ Diretório de logs criado');
  }
  
  // Arquivos de log
  const outLog = fs.openSync(path.join(logDir, 'server-out.log'), 'a');
  const errLog = fs.openSync(path.join(logDir, 'server-err.log'), 'a');
  
  console.log('📝 Logs serão salvos em:', logDir);
  
  // Iniciar o servidor
  console.log('\n🔄 Iniciando servidor...');
  
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: ['ignore', outLog, errLog],
    detached: true,
    env: { ...process.env, MONGODB_OFFLINE_MODE: process.env.MONGODB_OFFLINE_MODE }
  });
  
  serverProcess.on('error', (err) => {
    console.error('❌ Erro ao iniciar o servidor:', err.message);
  });
  
  // Verificar se o processo foi iniciado
  if (serverProcess.pid) {
    console.log(`✅ Servidor iniciado com PID: ${serverProcess.pid}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    
    // Desvincula o processo para que ele continue rodando mesmo após o script terminar
    serverProcess.unref();
    
    // Iniciar verificação de reservas
    startReservationCheck();
  } else {
    console.error('❌ Falha ao iniciar o servidor');
  }
}

// Função para verificar reservas periodicamente
function startReservationCheck() {
  console.log('\n🔄 Iniciando verificação periódica de reservas...');
  
  // Iniciar o script de verificação de reservas
  const checkProcess = spawn('node', ['verificar-transferencia-usd.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });
  
  checkProcess.on('close', (code) => {
    console.log(`\n✅ Verificação inicial de reservas concluída (código: ${code})`);
    
    // Configurar verificação periódica a cada 30 minutos
    console.log('⏰ Configurando verificação periódica a cada 30 minutos...');
    
    setInterval(() => {
      console.log(`\n🔄 Verificando reservas em ${new Date().toLocaleString()}...`);
      
      const periodicCheck = spawn('node', ['verificar-transferencia-usd.js'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit'
      });
      
      periodicCheck.on('error', (err) => {
        console.error('❌ Erro na verificação periódica:', err.message);
      });
    }, 30 * 60 * 1000); // 30 minutos
  });
}

// Iniciar o sistema
startServer().catch(err => {
  console.error('❌ Erro ao iniciar o sistema:', err.message);
  process.exit(1);
});
