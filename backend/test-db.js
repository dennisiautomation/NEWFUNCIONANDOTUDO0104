const { sequelize, testPostgresConnection } = require('./config/database');

// Testar conexão com PostgreSQL
const testConnection = async () => {
  try {
    console.log('Tentando conectar ao PostgreSQL...');
    const result = await testPostgresConnection();
    console.log('Resultado do teste de conexão:', result);
    
    console.log('Modelos disponíveis:');
    for (const model in sequelize.models) {
      console.log(`- ${model}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    process.exit(1);
  }
};

testConnection();
