/**
 * Teste para verificar a resposta do endpoint de contas do cliente
 */
const axios = require('axios');

// URL da API baseada no ambiente
const getAPIURL = () => {
  return 'https://global.newcashbank.com.br/api';
};

const API_URL = getAPIURL();

// Função principal de teste
async function testMyAccounts() {
  try {
    // Usar token fixo para teste - substitua pelo token de um usuário real
    const token = process.argv[2] || ''; // pegar token da linha de comando
    
    if (!token) {
      console.error('Por favor, forneça um token válido como argumento de linha de comando');
      process.exit(1);
    }
    
    console.log('Testando endpoint de contas em:', API_URL);
    console.log('Usando token:', token.substring(0, 10) + '...');
    
    // Fazer a requisição
    const response = await axios.get(`${API_URL}/accounts/my-accounts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Verificar e mostrar a resposta
    console.log('\n=== RESPOSTA DO SERVIDOR ===');
    console.log('Status:', response.status);
    console.log('Status da resposta:', response.data.status);
    
    if (response.data.data) {
      console.log(`\n=== ${response.data.data.length} CONTAS ENCONTRADAS ===`);
      response.data.data.forEach((account, index) => {
        console.log(`\nConta #${index + 1}:`);
        console.log('ID:', account.id);
        console.log('Moeda:', account.currency);
        console.log('Número:', account.accountNumber);
        console.log('Saldo:', account.balance);
        console.log('Status:', account.status);
      });
    } else {
      console.log('Nenhuma conta encontrada na resposta');
    }
    
  } catch (error) {
    console.error('ERRO AO TESTAR ENDPOINT:');
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
  }
}

// Executar o teste
testMyAccounts();
