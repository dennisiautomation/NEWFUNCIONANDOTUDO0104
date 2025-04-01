require('dotenv').config();
const axios = require('axios');
const https = require('https');
const http = require('http');

// Configurar o agente HTTP para ignorar erros de certificado
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
});

// Função para testar a conexão com a API FT
async function testFTApi() {
  console.log('=== Configurações da API FT ===');
  console.log(`Base URL: ${process.env.FT_API_BASE_URL}`);
  console.log(`API Key: ${process.env.FT_API_KEY}`);
  console.log(`Conta USD: ${process.env.USD_ACCOUNT}`);
  console.log(`Conta EUR: ${process.env.EUR_ACCOUNT}`);
  console.log('===============================');

  try {
    // URL da API para reservas USD
    const usdUrl = `${process.env.FT_API_BASE_URL}/Reservation.asp?key=${process.env.FT_API_KEY}&account=${process.env.USD_ACCOUNT}`;
    console.log(`Testando URL de reservas USD: ${usdUrl}`);
    
    const usdResponse = await axios.get(usdUrl, {
      httpsAgent: httpsAgent,
      httpAgent: httpAgent
    });
    
    console.log('Resposta da API de reservas USD:');
    console.log(JSON.stringify(usdResponse.data, null, 2));
    
    // URL da API para reservas EUR
    const eurUrl = `${process.env.FT_API_BASE_URL}/Reservation.asp?key=${process.env.FT_API_KEY}&account=${process.env.EUR_ACCOUNT}`;
    console.log(`\nTestando URL de reservas EUR: ${eurUrl}`);
    
    const eurResponse = await axios.get(eurUrl, {
      httpsAgent: httpsAgent,
      httpAgent: httpAgent
    });
    
    console.log('Resposta da API de reservas EUR:');
    console.log(JSON.stringify(eurResponse.data, null, 2));
    
    return {
      usdData: usdResponse.data,
      eurData: eurResponse.data
    };
  } catch (error) {
    console.error('Erro ao conectar com a API FT:');
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status fora do intervalo de 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error('Nenhuma resposta recebida do servidor');
      console.error(error.request);
    } else {
      // Erro na configuração da requisição
      console.error('Erro na configuração da requisição:', error.message);
    }
    return { error: error.message };
  }
}

// Executar o teste
testFTApi()
  .then(result => {
    if (!result.error) {
      console.log('\n=== Teste concluído com sucesso ===');
      console.log('Dados USD e EUR obtidos corretamente');
    } else {
      console.log('\n=== Teste concluído com erros ===');
    }
  })
  .catch(error => {
    console.error('\n=== Erro no teste ===');
    console.error(error);
  });
