const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Iniciando diagnóstico de conexão com PostgreSQL...');

// Configuração PostgreSQL
const pgConfig = {
  database: process.env.PG_DATABASE || 'newcashbank',
  username: process.env.PG_USER || 'newcashuser',
  password: process.env.PG_PASSWORD || 'secure_password',
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  dialect: 'postgres',
  logging: true
};

console.log('Configuração:', {
  database: pgConfig.database,
  username: pgConfig.username,
  host: pgConfig.host,
  port: pgConfig.port
});

// Inicializar Sequelize com PostgreSQL
const sequelize = new Sequelize(
  pgConfig.database,
  pgConfig.username,
  pgConfig.password,
  {
    host: pgConfig.host,
    port: pgConfig.port,
    dialect: pgConfig.dialect,
    logging: console.log
  }
);

// Testar conexão com PostgreSQL
const testConnection = async () => {
  try {
    console.log('Tentando autenticar...');
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    process.exit(1);
  }
};

const { sequelize: sequelizeInstance } = require('./pg-models');

async function diagnoseDatabase() {
    try {
        console.log('Iniciando diagnóstico do PostgreSQL...');
        
        // 1. Verificar conexão
        await sequelizeInstance.authenticate();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
        
        // 2. Verificar tabelas disponíveis
        const [tables] = await sequelizeInstance.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('\nTabelas disponíveis:', tables.length);
        tables.forEach(t => console.log(`- ${t.table_name}`));
        
        // 3. Verificar registros na tabela Users
        const [users] = await sequelizeInstance.query('SELECT COUNT(*) as count FROM "Users";')
            .catch(e => {
                console.error('❌ Erro ao consultar Users:', e.message);
                return [[{ count: 0 }]];
            });
        console.log(`\nUsuários cadastrados: ${users[0].count}`);
        
        // 4. Verificar registros na tabela Accounts
        const [accounts] = await sequelizeInstance.query('SELECT COUNT(*) as count FROM "Accounts";')
            .catch(e => {
                console.error('❌ Erro ao consultar Accounts:', e.message);
                return [[{ count: 0 }]];
            });
        console.log(`Contas cadastradas: ${accounts[0].count}`);
        
        // 5. Obter detalhes das tabelas principais
        if (tables.some(t => t.table_name === 'Users')) {
            await checkTableStructure('Users');
        }
        
        if (tables.some(t => t.table_name === 'Accounts')) {
            await checkTableStructure('Accounts');
        }
        
        // 6. Checar relacionamentos
        if (users[0].count > 0 && accounts[0].count > 0) {
            const [accountsWithUsers] = await sequelizeInstance.query(`
                SELECT COUNT(*) as count 
                FROM "Accounts" a
                JOIN "Users" u ON a."userId" = u.id;
            `).catch(e => {
                console.error('❌ Erro ao verificar relação Account-User:', e.message);
                return [[{ count: 0 }]];
            });
            
            console.log(`\nContas com usuários associados: ${accountsWithUsers[0].count}`);
        }
        
        // 7. Listar alguns dados de exemplo
        if (accounts[0].count > 0) {
            const [accountSamples] = await sequelizeInstance.query(`
                SELECT a.id, a."accountNumber", a.balance, a.currency, a.status, 
                       u.name as "userName", u.email as "userEmail"
                FROM "Accounts" a
                LEFT JOIN "Users" u ON a."userId" = u.id
                LIMIT 5;
            `).catch(e => {
                console.error('❌ Erro ao recuperar exemplos de contas:', e.message);
                return [[]];
            });
            
            console.log('\nExemplos de contas:');
            if (accountSamples.length > 0) {
                accountSamples.forEach(a => {
                    console.log(`- ID ${a.id}: ${a.accountNumber} (${a.currency}) - Saldo: ${a.balance} - Usuário: ${a.userName || 'N/A'}`);
                });
            } else {
                console.log('Nenhuma conta encontrada para exibir como exemplo.');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    } finally {
        process.exit(0);
    }
}

async function checkTableStructure(tableName) {
    try {
        const [columns] = await sequelizeInstance.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position;
        `);
        
        console.log(`\nEstrutura da tabela ${tableName}:`);
        columns.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
        });
    } catch (error) {
        console.error(`❌ Erro ao verificar estrutura de ${tableName}:`, error.message);
    }
}

// Executar diagnóstico
diagnoseDatabase();
