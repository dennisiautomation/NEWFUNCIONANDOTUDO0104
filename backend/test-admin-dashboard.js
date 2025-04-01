/**
 * Script de teste para o painel administrativo
 * Este script testa o acesso ao painel administrativo e exibe as contas correspondentes
 */
const express = require('express');
const dotenv = require('dotenv');
const FTApiService = require('./services/ftApi.service');

// Carregar variáveis de ambiente
dotenv.config();

// Criar um servidor Express simples
const app = express();
const PORT = 3001;

// Rota para testar o dashboard administrativo
app.get('/test-dashboard', async (req, res) => {
  try {
    console.log('Testando dashboard administrativo...');
    
    // Buscar dados das contas correspondentes
    let usdAccountData = null;
    let eurAccountData = null;
    
    try {
      console.log('Buscando dados da conta USD...');
      usdAccountData = await FTApiService.getUsdReservations();
      console.log('Dados da conta USD obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter dados da conta USD:', error.message);
      // Dados simulados em caso de erro
      usdAccountData = {
        "ReservationsOverview 0.9": {
          "Name": "NewCash Bank",
          "Country": "Brazil",
          "Website": "newcashbank.com.br",
          "NumberOfRecords": "1",
          "Details": {
            "RecordNumber": "1",
            "AuthToken": "simulado",
            "AccountName": "NewCash Bank",
            "AccountSignatory": "Mr. Dennis Canteli",
            "Amount": "1000000",
            "Currency": "USD"
          }
        }
      };
    }
    
    try {
      console.log('Buscando dados da conta EUR...');
      eurAccountData = await FTApiService.getEurReservations();
      console.log('Dados da conta EUR obtidos com sucesso');
    } catch (error) {
      console.error('Erro ao obter dados da conta EUR:', error.message);
      // Dados simulados em caso de erro
      eurAccountData = {
        "ReservationsOverview 0.9": {
          "Name": "NewCash Bank",
          "Country": "Brazil",
          "Website": "newcashbank.com.br",
          "NumberOfRecords": "1",
          "Details": {
            "RecordNumber": "1",
            "AuthToken": "simulado",
            "AccountName": "NewCash Bank",
            "AccountSignatory": "Mr. Dennis Canteli",
            "Amount": "500000",
            "Currency": "EUR"
          }
        }
      };
    }
    
    // Dados do dashboard
    const dashboardData = {
      status: 'success',
      data: {
        // Estatísticas gerais
        totalUsers: 120,
        totalAccounts: 145,
        totalTransactions: 1250,
        totalReservations: 85,
        
        // Contas correspondentes
        correspondentAccounts: {
          usd: {
            accountNumber: process.env.USD_ACCOUNT || '60428',
            data: usdAccountData
          },
          eur: {
            accountNumber: process.env.EUR_ACCOUNT || '60429',
            data: eurAccountData
          }
        }
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Erro no teste do dashboard admin:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar o dashboard',
      error: error.message
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/test-dashboard para testar o dashboard`);
});

// Exibir informações de configuração
console.log('=== Configurações da API FT ===');
console.log('Base URL:', process.env.FT_API_BASE_URL);
console.log('API Key:', process.env.FT_API_KEY);
console.log('Conta USD:', process.env.USD_ACCOUNT);
console.log('Conta EUR:', process.env.EUR_ACCOUNT);
console.log('===============================');
