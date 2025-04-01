const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração PostgreSQL
const pgConfig = {
  database: process.env.PG_DATABASE || 'newcashbank',
  username: process.env.PG_USER || 'newcashuser',
  password: process.env.PG_PASSWORD || 'secure_password',
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.PG_USE_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Inicializar Sequelize com PostgreSQL
const sequelize = new Sequelize(
  pgConfig.database,
  pgConfig.username,
  pgConfig.password,
  {
    host: pgConfig.host,
    port: pgConfig.port,
    dialect: pgConfig.dialect,
    logging: pgConfig.logging,
    dialectOptions: pgConfig.dialectOptions,
    pool: pgConfig.pool
  }
);

// Testar conexão com PostgreSQL
const testPostgresConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testPostgresConnection
};
