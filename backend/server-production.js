/**
 * Servidor simplificado para produção - Não depende do MongoDB
 * Apenas expõe as rotas da API FT para monitoramento
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para registrar chamadas de API
const apiLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'Unknown',
    body: req.body,
    query: req.query
  };
  
  console.log(`[API] ${timestamp} - ${req.method} ${req.originalUrl}`);
  
  // Salvar log em arquivo
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'api-calls.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  next();
};

// Aplicar middleware de log para todas as rotas da API FT
app.use('/api/ft', apiLogger);

// Rota para verificar status do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mode: 'production',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ftApiBaseUrl: process.env.FT_API_BASE_URL,
    usdAccount: process.env.USD_ACCOUNT,
    eurAccount: process.env.EUR_ACCOUNT
  });
});

// Rota para obter informações das contas monitoradas
app.get('/api/accounts/status', (req, res) => {
  res.json({
    accounts: [
      {
        id: process.env.USD_ACCOUNT,
        currency: 'USD',
        status: 'active',
        lastChecked: new Date().toISOString()
      },
      {
        id: process.env.EUR_ACCOUNT,
        currency: 'EUR',
        status: 'active',
        lastChecked: new Date().toISOString()
      }
    ]
  });
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Rota para todas as outras requisições - serve o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Servidor de produção rodando na porta ${PORT}`);
  console.log(`===========================================`);
  console.log(`Modo: Produção (sem MongoDB)`);
  console.log(`API FT: ${process.env.FT_API_BASE_URL}`);
  console.log(`Conta USD: ${process.env.USD_ACCOUNT}`);
  console.log(`Conta EUR: ${process.env.EUR_ACCOUNT}`);
  console.log(`===========================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

module.exports = app; // For testing purposes
