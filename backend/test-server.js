const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configurações da API FT
const baseUrl = process.env.FT_API_BASE_URL || 'http://mytest.ftassetmanagement.com/api';
const apiKey = process.env.FT_API_KEY || '6d9bac1b-f685-11ef-a3af-00155d010b18';
const usdAccount = process.env.USD_ACCOUNT || '60428';
const eurAccount = process.env.EUR_ACCOUNT || '60429';

// Inicializar o servidor Express
const app = express();
const PORT = 3000;

// Middleware para parsing de JSON
app.use(express.json());

// Rota de teste
app.get('/test', (req, res) => {
  res.json({
    message: 'Servidor de teste funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para obter dados da conta USD
app.get('/usd', async (req, res) => {
  try {
    console.log('Acessando API de reservas USD...');
    console.log('URL:', `${baseUrl}/Reservation.asp?key=${apiKey}&account=${usdAccount}`);
    
    const response = await axios.get(`${baseUrl}/Reservation.asp?key=${apiKey}&account=${usdAccount}`);
    
    // Formatar os dados da resposta
    const accountData = {
      accountNumber: usdAccount,
      balance: 50000.00, // Valor simulado, já que a API não retorna saldo
      currency: 'USD',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      apiResponse: response.data
    };
    
    res.json({
      status: 'success',
      data: accountData
    });
  } catch (error) {
    console.error('Erro ao acessar API de reservas USD:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    
    // Retornar dados simulados em caso de erro
    res.json({
      status: 'error',
      message: `Erro ao acessar API FT: ${error.message}`,
      data: {
        accountNumber: usdAccount,
        balance: 50000.00,
        currency: 'USD',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        note: 'Dados simulados devido a erro na API FT'
      }
    });
  }
});

// Rota para obter dados da conta EUR
app.get('/eur', async (req, res) => {
  try {
    console.log('Acessando API de reservas EUR...');
    console.log('URL:', `${baseUrl}/Reservation.asp?key=${apiKey}&account=${eurAccount}`);
    
    const response = await axios.get(`${baseUrl}/Reservation.asp?key=${apiKey}&account=${eurAccount}`);
    
    // Formatar os dados da resposta
    const accountData = {
      accountNumber: eurAccount,
      balance: 45000.00, // Valor simulado, já que a API não retorna saldo
      currency: 'EUR',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      apiResponse: response.data
    };
    
    res.json({
      status: 'success',
      data: accountData
    });
  } catch (error) {
    console.error('Erro ao acessar API de reservas EUR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    
    // Retornar dados simulados em caso de erro
    res.json({
      status: 'error',
      message: `Erro ao acessar API FT: ${error.message}`,
      data: {
        accountNumber: eurAccount,
        balance: 45000.00,
        currency: 'EUR',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        note: 'Dados simulados devido a erro na API FT'
      }
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
  console.log('Rotas disponíveis:');
  console.log(`- http://localhost:${PORT}/test`);
  console.log(`- http://localhost:${PORT}/usd`);
  console.log(`- http://localhost:${PORT}/eur`);
});
