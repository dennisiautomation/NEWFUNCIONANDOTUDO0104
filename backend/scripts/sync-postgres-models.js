/**
 * Script para sincronizar modelos do PostgreSQL
 * Este script inicializa as tabelas do PostgreSQL de acordo com os modelos definidos
 */

const { sequelize } = require('../pg-models');

// Função para sincronizar modelos
async function syncModels() {
  try {
    console.log('Iniciando sincronização dos modelos PostgreSQL...');
    
    // Sincronizar todos os modelos
    await sequelize.sync({ alter: true });
    
    console.log('Sincronização dos modelos PostgreSQL concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar modelos PostgreSQL:', error);
    process.exit(1);
  }
}

// Executar sincronização
syncModels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  });
