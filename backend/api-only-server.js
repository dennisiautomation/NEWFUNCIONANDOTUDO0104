/**
 * Servidor somente com APIs - NewCash Bank System
 * Versão que funciona exclusivamente com as APIs de produção, sem MongoDB
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const LoggerService = require('./services/logger.service');
const apiLoggerMiddleware = require('./middleware/api-logger.middleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Logger middleware - registra todas as chamadas de API
app.use('/api/ft', apiLoggerMiddleware());

// API routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes.js');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const reservationRoutes = require('./routes/reservation.routes');
const ftApiRoutes = require('./routes/ftApi.routes');
const adminRoutes = require('./routes/admin.routes');
const securityRoutes = require('./routes/security.routes');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ft', ftApiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/security', securityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Registrar erro no serviço de log
  LoggerService.logSystemError(`Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

try {
  // Iniciar o servidor sem MongoDB
  console.log('Iniciando NewCash Bank System somente com APIs de produção...');
  console.log('INFO: Este modo usa apenas as APIs da FT, sem armazenamento MongoDB');
  console.log('Base URL FT API:', process.env.FT_API_BASE_URL || 'http://mytest.ftassetmanagement.com/api');
  console.log('Conta USD:', process.env.USD_ACCOUNT || '60428');
  console.log('Conta EUR:', process.env.EUR_ACCOUNT || '60429');

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} (Modo somente APIs)`);
    console.log(`Acesse o frontend em: http://localhost:${process.env.PORT || 5000}`);
  });
} catch (error) {
  console.error('ERRO FATAL AO INICIAR SERVIDOR:', error.message);
  console.error('Stack trace:', error.stack);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});

module.exports = app; // For testing purposes
