const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Importar configurações do banco de dados
const { testPostgresConnection } = require('./config/database');
const { syncModels } = require('./pg-models');

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar conexão com o banco de dados PostgreSQL
const initDatabase = async () => {
  try {
    // Testar conexão com PostgreSQL
    await testPostgresConnection();
    
    // Sincronizar modelos do PostgreSQL (force: false para não recriar tabelas)
    await syncModels(false);
    
    console.log('Conexão com banco de dados PostgreSQL inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados PostgreSQL:', error);
  }
};

// Inicializar banco de dados
initDatabase();

// Importar rotas
const adminRoutes = require('./routes/admin.routes');
const ftAccountsRoutes = require('./routes/ft-accounts.routes');
const userPreferencesRoutes = require('./routes/user-preferences.routes');
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const currencyTransferRoutes = require('./routes/currency-transfer.routes');

// Rota de saúde
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date(),
        database: 'postgresql'
    });
});

// Registrar rotas
app.use('/api/admin', adminRoutes);
app.use('/api/ft-accounts', ftAccountsRoutes);
app.use('/api/user', userPreferencesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/currency-transfer', currencyTransferRoutes);

// Dados simulados para teste (até que os dados reais sejam migrados)
app.get('/api/account/balance', (req, res) => {
    res.json({
        usd_account: '60428',
        eur_account: '60429',
        usd_balance: 1000000.00,
        eur_balance: 850000.00
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Sistema PostgreSQL ativo`);
});
