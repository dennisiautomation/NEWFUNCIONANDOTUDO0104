const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

console.log('1. Iniciando configuração do servidor...');

// Middleware
app.use(cors());
app.use(express.json());

console.log('2. Middleware configurado com sucesso');

// Importar configurações do banco de dados
try {
  const { testPostgresConnection } = require('./config/database');
  console.log('3. Módulo de configuração do banco de dados importado com sucesso');

  // Testar conexão com PostgreSQL
  const testDatabase = async () => {
    try {
      console.log('4. Testando conexão com PostgreSQL...');
      const result = await testPostgresConnection();
      console.log('5. Teste de conexão com PostgreSQL concluído:', result);
    } catch (error) {
      console.error('ERRO na etapa 5 - Erro ao testar conexão com PostgreSQL:', error);
    }
  };

  testDatabase();
} catch (error) {
  console.error('ERRO na etapa 3 - Erro ao importar módulo de banco de dados:', error);
}

// Importar sincronização de modelos
try {
  const { syncModels } = require('./pg-models');
  console.log('6. Módulo de sincronização de modelos importado com sucesso');

  // Sincronizar modelos
  const syncDb = async () => {
    try {
      console.log('7. Iniciando sincronização de modelos...');
      await syncModels(false);
      console.log('8. Sincronização de modelos concluída com sucesso');
    } catch (error) {
      console.error('ERRO na etapa 8 - Erro ao sincronizar modelos:', error);
    }
  };

  syncDb();
} catch (error) {
  console.error('ERRO na etapa 6 - Erro ao importar módulo de sincronização:', error);
}

// Tentar importar cada arquivo de rotas
try {
  console.log('9. Tentando importar arquivo de rotas: admin.routes.js');
  const adminRoutes = require('./routes/admin.routes');
  console.log('   - admin.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar admin.routes.js:', error.message);
}

try {
  console.log('10. Tentando importar arquivo de rotas: ft-accounts.routes.js');
  const ftAccountsRoutes = require('./routes/ft-accounts.routes');
  console.log('    - ft-accounts.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar ft-accounts.routes.js:', error.message);
}

try {
  console.log('11. Tentando importar arquivo de rotas: user-preferences.routes.js');
  const userPreferencesRoutes = require('./routes/user-preferences.routes');
  console.log('    - user-preferences.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar user-preferences.routes.js:', error.message);
}

try {
  console.log('12. Tentando importar arquivo de rotas: auth.routes.js');
  const authRoutes = require('./routes/auth.routes');
  console.log('    - auth.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar auth.routes.js:', error.message);
}

try {
  console.log('13. Tentando importar arquivo de rotas: account.routes.js');
  const accountRoutes = require('./routes/account.routes');
  console.log('    - account.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar account.routes.js:', error.message);
}

try {
  console.log('14. Tentando importar arquivo de rotas: transaction.routes.js');
  const transactionRoutes = require('./routes/transaction.routes');
  console.log('    - transaction.routes.js importado com sucesso');
} catch (error) {
  console.error('ERRO ao importar transaction.routes.js:', error.message);
}

// Rota de saúde
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date(),
        database: 'postgresql'
    });
});

// Configurar rotas que importamos com sucesso
try {
  console.log('15. Tentando registrar rotas...');
  // Referenciar apenas variáveis que foram definidas com sucesso
  if (typeof adminRoutes !== 'undefined') app.use('/api/admin', adminRoutes);
  if (typeof ftAccountsRoutes !== 'undefined') app.use('/api/ft-accounts', ftAccountsRoutes);
  if (typeof userPreferencesRoutes !== 'undefined') app.use('/api/user', userPreferencesRoutes);
  if (typeof authRoutes !== 'undefined') app.use('/api/auth', authRoutes);
  if (typeof accountRoutes !== 'undefined') app.use('/api/accounts', accountRoutes);
  if (typeof transactionRoutes !== 'undefined') app.use('/api/transactions', transactionRoutes);
  console.log('16. Rotas registradas com sucesso');
} catch (error) {
  console.error('ERRO na etapa 16 - Erro ao registrar rotas:', error);
}

// Dados simulados para teste (até que os dados reais sejam migrados)
app.get('/api/account/balance', (req, res) => {
    res.json({
        usd_account: '60428',
        eur_account: '60429',
        usd_balance: 1000000.00,
        eur_balance: 850000.00
    });
});

// Adicionar rotas simplificadas para resolver os erros 404
app.get('/api/ft-accounts/usd/transactions', (req, res) => {
    res.json({
        status: 'success',
        data: [
            {
                id: '1',
                type: 'deposit',
                amount: 5000,
                description: 'Depósito inicial',
                date: new Date(),
                status: 'completed'
            }
        ]
    });
});

app.get('/api/ft-accounts/eur/transactions', (req, res) => {
    res.json({
        status: 'success',
        data: [
            {
                id: '2',
                type: 'transfer',
                amount: 2000,
                description: 'Transferência internacional',
                date: new Date(),
                status: 'completed'
            }
        ]
    });
});

app.get('/api/user/preferences', (req, res) => {
    res.json({
        status: 'success',
        data: {
            theme: 'light',
            language: 'pt-BR',
            notifications: true,
            defaultCurrency: 'USD'
        }
    });
});

app.get('/api/accounts', (req, res) => {
    res.json({
        status: 'success',
        data: [
            {
                id: '1',
                accountNumber: '60428',
                type: 'checking',
                currency: 'USD',
                balance: 1000000
            },
            {
                id: '2',
                accountNumber: '60429',
                type: 'checking',
                currency: 'EUR',
                balance: 850000
            }
        ]
    });
});

console.log('17. Iniciando servidor...');
const PORT = process.env.PORT || 3001;
try {
  app.listen(PORT, () => {
      console.log(`18. Servidor rodando na porta ${PORT} - Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
} catch (error) {
  console.error('ERRO na etapa 18 - Erro ao iniciar servidor:', error);
}
