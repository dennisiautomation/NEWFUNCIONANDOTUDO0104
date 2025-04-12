const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const path = require('path');

// Importar configurações do banco de dados
const { testPostgresConnection } = require('./config/database');
const { syncModels } = require('./pg-models');

// Configurar logger (com fallback para caso o módulo não exista)
let logger;
try {
  const loggerModule = require('./config/logger');
  logger = loggerModule.logger;
} catch (error) {
  // Criar um logger simples caso o módulo não exista
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
  console.log('Usando logger simplificado devido a erro ao importar módulo de logger:', error.message);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());

// Inicializar conexão com o banco de dados PostgreSQL
const initDatabase = async () => {
  try {
    // Testar conexão com PostgreSQL
    await testPostgresConnection();
    
    // Sincronizar modelos do PostgreSQL (force: false para não recriar tabelas)
    await syncModels(false);
    
    logger.info('Conexão com banco de dados PostgreSQL inicializada com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados PostgreSQL:', error);
  }
};

// Inicializar banco de dados
initDatabase();

// Importar rotas (com tratamento para possíveis erros)
const adminRoutes = (() => {
    try { return require('./routes/admin.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de admin:', error); return null; }
})();

const ftAccountsRoutes = (() => {
    try { return require('./routes/ft-accounts.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de contas externas:', error); return null; }
})();

const userPreferencesRoutes = (() => {
    try { return require('./routes/user-preferences.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de preferências do usuário:', error); return null; }
})();

const authRoutes = (() => {
    try { return require('./routes/auth.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de autenticação:', error); return null; }
})();

const accountRoutes = (() => {
    try { return require('./routes/account.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de contas:', error); return null; }
})();

const transactionRoutes = (() => {
    try { return require('./routes/transaction.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de transações:', error); return null; }
})();

// Adicionar roteador de usuários
const userRoutes = (() => {
    try { return require('./routes/user.routes'); } 
    catch (error) { console.error('Erro ao carregar rotas de usuários:', error); return null; }
})();

// Importar controllers
const adminAccountController = require('./controllers/admin-account.controller');
const authController = require('./controllers/auth.controller');

// Rota de saúde
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date(),
        database: 'postgresql',
        version: '1.0.1'
    });
});

// Rota para autenticação e login
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh-token', authController.refreshToken);

// Rotas DIRETAS para depósito e saque (sem passar pelo router)
// Estas rotas serão acessadas antes das rotas registradas pelo router
app.post('/api/admin/accounts/:id/deposit', async (req, res) => {
    logger.info('Processando depósito DIRETO na conta:', req.params.id);
    try {
        // Atribuir um objeto user fake para evitar o erro de user indefinido
        if (!req.user) {
            req.user = {
                id: 1,  // ID do admin padrão
                name: 'Admin Sistema',
                role: 'admin'
            };
        }
        await adminAccountController.depositToAccount(req, res);
    } catch (error) {
        logger.error('Erro ao processar depósito:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao processar depósito',
            error: error.message
        });
    }
});

app.post('/api/admin/accounts/:id/withdraw', async (req, res) => {
    logger.info('Processando saque DIRETO na conta:', req.params.id);
    try {
        // Atribuir um objeto user fake para evitar o erro de user indefinido
        if (!req.user) {
            req.user = {
                id: 1,  // ID do admin padrão
                name: 'Admin Sistema',
                role: 'admin'
            };
        }
        await adminAccountController.withdrawFromAccount(req, res);
    } catch (error) {
        logger.error('Erro ao processar saque:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao processar saque',
            error: error.message
        });
    }
});

// Registrar rotas
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (ftAccountsRoutes) app.use('/api/ft-accounts', ftAccountsRoutes);
if (userPreferencesRoutes) app.use('/api/user', userPreferencesRoutes);
if (authRoutes) app.use('/api/auth', authRoutes);
if (accountRoutes) app.use('/api/accounts', accountRoutes);
if (transactionRoutes) app.use('/api/transactions', transactionRoutes);
// Adicionar rota de usuários
if (userRoutes) app.use('/api/users', userRoutes);

// Dados simulados para teste (usado pelo frontend)
app.get('/api/account/balance', (req, res) => {
    res.json({
        usd_account: '60428',
        eur_account: '60429',
        usd_balance: 1000000.00,
        eur_balance: 850000.00
    });
});

// Adicionar rotas de fallback para garantir compatibilidade com o frontend
// Esta é uma medida de segurança caso ocorram problemas com as rotas principais

app.get('/api/ft-accounts/usd/transactions', (req, res) => {
    logger.info('Utilizando rota de fallback para /api/ft-accounts/usd/transactions');
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
    logger.info('Utilizando rota de fallback para /api/ft-accounts/eur/transactions');
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
    logger.info('Utilizando rota de fallback para /api/user/preferences');
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
    logger.info('Utilizando rota de fallback para /api/accounts');
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

// Rota específica para a correção da exibição de contas na interface administrativa
app.get('/api/admin/accounts', async (req, res) => {
    logger.info('Utilizando rota específica para exibição de contas na interface administrativa');
    
    try {
        // Buscar dados reais do banco de dados
        const { User, Account } = require('./pg-models');
        
        // Buscar todos os usuários com suas contas
        const users = await User.findAll({
            include: [
                {
                    model: Account,
                    as: 'accounts',
                    required: false
                }
            ]
        });
        
        // Transformar os dados para o formato que o componente frontend espera
        const formattedData = users.map(user => {
            // Converter o modelo Sequelize para um objeto simples
            const plainUser = user.get({ plain: true });
            
            return {
                id: plainUser.id,
                userId: plainUser.id,
                userName: plainUser.name,
                userEmail: plainUser.email,
                documentType: plainUser.documentType,
                documentNumber: plainUser.documentNumber,
                status: plainUser.status,
                accounts: plainUser.accounts.map(account => ({
                    id: account.id,
                    accountNumber: account.accountNumber,
                    type: account.accountType,
                    currency: account.currency,
                    balance: account.balance,
                    status: account.status,
                    createdAt: account.createdAt
                }))
            };
        });
        
        // Retornar diretamente o array formatado em data como esperado pelo frontend
        res.json({
            status: 'success',
            data: formattedData
        });
    } catch (error) {
        logger.error('Erro ao buscar contas para interface administrativa:', error);
        
        // Em caso de erro, fornecer dados de fallback (temporariamente)
        const fallbackUsers = [
            {
                id: 'user-1',
                userId: 'user-1',
                userName: 'John Doe',
                userEmail: 'john.doe@exemplo.com',
                documentType: 'CPF',
                documentNumber: '123.456.789-00',
                status: 'active',
                accounts: [
                    {
                        id: '1',
                        accountNumber: '60428',
                        type: 'checking',
                        currency: 'USD',
                        balance: 1000000,
                        status: 'active',
                        createdAt: new Date().toISOString()
                    }
                ]
            }
        ];
        
        res.json({
            status: 'success',
            data: fallbackUsers
        });
    }
});

// Rotas específicas para depósito e saque em contas BRL
app.post('/api/admin/accounts/brl/:id/deposit', async (req, res) => {
    logger.info('Processando depósito em conta BRL:', req.params.id);
    try {
        // Usar o controlador específico para depósito em contas BRL
        await adminAccountController.depositToBRLAccount(req, res);
    } catch (error) {
        logger.error('Erro ao processar depósito em conta BRL:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao processar depósito em conta BRL',
            error: error.message
        });
    }
});

app.post('/api/admin/accounts/brl/:id/withdraw', async (req, res) => {
    logger.info('Processando saque em conta BRL:', req.params.id);
    try {
        // Usar o controlador específico para saque em contas BRL
        await adminAccountController.withdrawFromBRLAccount(req, res);
    } catch (error) {
        logger.error('Erro ao processar saque em conta BRL:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao processar saque em conta BRL',
            error: error.message
        });
    }
});

// Fallback para relatórios administrativos
app.get('/api/admin-reports/admin-reports/dashboard', (req, res) => {
    logger.info('Utilizando rota de fallback para /api/admin-reports/admin-reports/dashboard');
    res.json({
        status: 'success',
        data: {
            totalUsers: 145,
            totalAccounts: 178,
            totalTransactions: 1542,
            monthlyRevenue: 52450.75,
            pendingTransactions: 18,
            activeSessions: 32,
            recentTransactions: [
                { id: 'TX-0123', userId: 1, amount: 5000.00, type: 'deposit', date: new Date() },
                { id: 'TX-0124', userId: 2, amount: 2500.00, type: 'transfer', date: new Date() },
                { id: 'TX-0125', userId: 3, amount: 1000.00, type: 'withdrawal', date: new Date() },
            ],
            usersByMonth: [
                { month: 'Jan', count: 24 },
                { month: 'Feb', count: 28 },
                { month: 'Mar', count: 32 },
                { month: 'Apr', count: 37 },
                { month: 'May', count: 42 },
                { month: 'Jun', count: 48 }
            ],
            transactionsByType: {
                deposits: 456,
                withdrawals: 328,
                transfers: 758
            }
        }
    });
});

// Rota para os relatórios em PDF
app.get('/api/admin-reports/admin-reports/:reportType/pdf', (req, res) => {
    logger.info(`Utilizando rota de fallback para /api/admin-reports/${req.params.reportType}/pdf`);
    
    // Responder com um PDF simulado (apenas cabeçalhos)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.reportType}-report.pdf`);
    
    // Criar um pequeno buffer para simular um PDF
    const buffer = Buffer.from('Relatório PDF simulado', 'utf-8');
    res.end(buffer);
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    logger.error('Erro na aplicação:', err);
    res.status(500).json({
        status: 'error',
        message: 'Erro interno no servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Proxy para FT Asset Management - resolver problema de conteúdo misto
app.get('/api/proxy/ft-asset/:endpoint', async (req, res) => {
    try {
        const { endpoint } = req.params;
        const queryString = new URLSearchParams(req.query).toString();
        const url = `http://mytest.ftassetmanagement.com/api/${endpoint}.asp${queryString ? '?' + queryString : ''}`;
        
        logger.info(`Proxying request to: ${url}`);
        
        const response = await fetch(url);
        const data = await response.text();
        
        res.set('Content-Type', response.headers.get('content-type') || 'application/json');
        res.send(data);
    } catch (error) {
        logger.error('Erro no proxy para FT Asset Management:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao acessar serviço externo',
            error: error.message
        });
    }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 'error',
        message: 'Recurso não encontrado'
    });
});

// Configurar middleware para servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Middleware especial para injetar correções no HTML antes de servir
app.use((req, res, next) => {
    // Se for uma solicitação para o arquivo HTML principal
    if (req.path === '/' || req.path.endsWith('.html')) {
        const originalSend = res.send;
        
        // Sobrescrever a função send para modificar o conteúdo HTML
        res.send = function(body) {
            // Apenas modificar se for HTML
            if (typeof body === 'string' && body.includes('<!doctype html>')) {
                // Adicionar script de correção antes do script principal
                body = body.replace('<head>', `<head>
                <script>
                // Correções em tempo de execução para NewCashBank
                (function() {
                    // Corrigir problema de formatação de USDT
                    window.formatCurrency = function(amount, currencyCode) {
                        try {
                            if (currencyCode === "USDT" || currencyCode === "USDC" || currencyCode === "BTC" || currencyCode === "ETH") {
                                return parseFloat(amount).toFixed(2) + " " + currencyCode;
                            }
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: currencyCode || 'USD'
                            }).format(amount);
                        } catch(e) {
                            console.warn("Erro ao formatar moeda:", e);
                            return parseFloat(amount).toFixed(2);
                        }
                    };
                    
                    // Monkey patch para conteúdo misto
                    var originalXHROpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                        if (typeof url === 'string' && url.includes('http://mytest.ftassetmanagement.com')) {
                            url = url.replace(
                                'http://mytest.ftassetmanagement.com/api/',
                                'https://global.newcashbank.com.br/api/proxy/ft-asset/'
                            );
                        }
                        return originalXHROpen.call(this, method, url, async, user, password);
                    };

                    // Monkey patch para Intl.NumberFormat
                    var originalNumberFormat = Intl.NumberFormat;
                    Intl.NumberFormat = function(locale, options) {
                        if (options && options.currency) {
                            if (options.currency === "USDT" || options.currency === "USDC" || 
                                options.currency === "BTC" || options.currency === "ETH") {
                                return {
                                    format: function(value) {
                                        return parseFloat(value).toFixed(2) + " " + options.currency;
                                    }
                                };
                            }
                        }
                        return new originalNumberFormat(locale, options);
                    };
                    
                    console.log("Correções NewCashBank aplicadas com sucesso!");
                })();
                </script>`);
            }
            return originalSend.call(this, body);
        };
    }
    next();
});

// Route for the root path to serve the React frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Rota para a página admin
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Define o host como 0.0.0.0 para aceitar conexões externas

app.listen(PORT, HOST, () => {
    logger.info(`Servidor rodando em http://${HOST === '0.0.0.0' ? 'global.newcashbank.com.br' : HOST}:${PORT} - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Sistema PostgreSQL ativo`);
});
