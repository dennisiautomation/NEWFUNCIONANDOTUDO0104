/**
 * Servidor FT API-Only - NewCash Bank System
 * Versão minimalista que funciona exclusivamente com as APIs de produção da FT Asset Management, sem MongoDB
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Importar serviço FT API - já exportado como instância
const ftApiService = require('./services/ftApi.service');

// Informações de configuração
console.log('==== NEWCASH BANK SYSTEM - MODO FT API ====');
console.log('Base URL FT API:', ftApiService.baseUrl);
console.log('API Key:', ftApiService.apiKey ? '***CONFIGURADA***' : 'NÃO CONFIGURADA');
console.log('Conta USD:', ftApiService.usdAccount);
console.log('Conta EUR:', ftApiService.eurAccount);

// Rotas da API FT
app.get('/api/ft/reservations/usd', async (req, res) => {
  try {
    const data = await ftApiService.getUsdReservations();
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Erro ao buscar reservas USD:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar reservas USD', 
      error: error.message 
    });
  }
});

app.get('/api/ft/reservations/eur', async (req, res) => {
  try {
    const data = await ftApiService.getEurReservations();
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Erro ao buscar reservas EUR:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar reservas EUR', 
      error: error.message 
    });
  }
});

app.post('/api/ft/reservations/confirm', async (req, res) => {
  try {
    const { refNum, status } = req.body;
    if (!refNum || !status) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Parâmetros refNum e status são obrigatórios' 
      });
    }
    
    const data = await ftApiService.confirmReservation(refNum, status);
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Erro ao confirmar reserva:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao confirmar reserva', 
      error: error.message 
    });
  }
});

app.get('/api/ft/transfers/incoming', async (req, res) => {
  try {
    const data = await ftApiService.checkIncomingTransfers();
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Erro ao verificar transferências recebidas:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao verificar transferências recebidas', 
      error: error.message 
    });
  }
});

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'API em funcionamento - Modo FT API Only',
    timestamp: new Date(),
    ftApiAvailable: true,
    mongodbAvailable: false,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de fallback para arquivos estáticos do frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} (Modo somente FT API)`);
  console.log(`Acesse a API em: http://localhost:${PORT}/api/status`);
  console.log(`Acesse API de reservas USD em: http://localhost:${PORT}/api/ft/reservations/usd`);
});

// Tratamento de exceções
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

module.exports = app; // Para testes
