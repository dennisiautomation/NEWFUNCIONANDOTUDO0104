const { receivingApi } = require('./api');
const axios = require('axios'); // Adicione essa linha para importar o axios

class AccountService {
  constructor() {
    // Dados do cliente logado
    this.currentUser = null;
  }

  /**
   * Define o usuário atual
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Valida se o usuário pode acessar uma conta
   */
  validateAccountAccess(accountNumber) {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se a conta pertence ao usuário
    if (this.currentUser.accountNumber !== accountNumber) {
      throw new Error('Acesso não autorizado a esta conta');
    }
  }

  /**
   * Busca transferências recebidas do usuário atual
   */
  async getIncomingTransfers() {
    try {
      if (!this.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Busca transferências
      const result = await receivingApi.getIncomingTransfers();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Filtra apenas transferências da conta do usuário
      const userTransfers = result.transfers.filter(transfer => 
        transfer.receiverAccount === this.currentUser.accountNumber
      );

      return {
        success: true,
        transfers: userTransfers
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        transfers: []
      };
    }
  }

  /**
   * Busca saldo da conta
   */
  async getBalance(accountNumber) {
    try {
      // Valida acesso
      this.validateAccountAccess(accountNumber);

      // TODO: Implementar chamada à API de saldo
      const currency = this.getCurrency(accountNumber);
      return {
        success: true,
        balance: {
          available: 1000.00,
          currency: currency
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        balance: null
      };
    }
  }

  /**
   * Obter detalhes da conta USD
   */
  async getUSDAccount() {
    try {
      const response = await receivingApi.get('/accounts/usd/account');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar conta USD:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes da conta EUR
   */
  async getEURAccount() {
    try {
      const response = await receivingApi.get('/accounts/eur/account');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar conta EUR:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes da conta BRL
   */
  async getBRLAccount() {
    try {
      const response = await receivingApi.get('/accounts/brl/account');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar conta BRL:', error);
      throw error;
    }
  }

  /**
   * Obter transações da conta USD
   */
  async getUSDTransactions() {
    try {
      const response = await receivingApi.get('/accounts/usd/transactions');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar transações USD:', error);
      throw error;
    }
  }

  /**
   * Obter transações da conta EUR
   */
  async getEURTransactions() {
    try {
      const response = await receivingApi.get('/accounts/eur/transactions');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar transações EUR:', error);
      throw error;
    }
  }

  /**
   * Obter transações da conta BRL
   */
  async getBRLTransactions() {
    try {
      const response = await receivingApi.get('/accounts/brl/transactions');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar transações BRL:', error);
      throw error;
    }
  }

  /**
   * Criar uma nova conta BRL
   */
  async createBRLAccount(userData) {
    try {
      const response = await receivingApi.post('/accounts/brl/create', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar conta BRL:', error);
      throw error;
    }
  }

  /**
   * Obter moeda da conta
   */
  getCurrency(accountNumber) {
    if (accountNumber === '42226') {
      return 'USD';
    } else if (accountNumber === '12345') {
      return 'EUR';
    } else {
      return 'BRL';
    }
  }

  /**
   * Obter moeda da conta pelo ID
   * @param {string} accountId - ID da conta
   * @returns {string} - Moeda da conta (USD, EUR, BRL)
   */
  getAccountCurrency(accountId) {
    // Implementação temporária
    if (accountId.includes('usd')) {
      return 'USD';
    } else if (accountId.includes('eur')) {
      return 'EUR';
    } else {
      return 'BRL';
    }
  }

  /**
   * Obter saldo da conta BRL
   * @param {string} accountId - ID da conta
   * @returns {Promise<Object>} - Dados da conta BRL
   */
  async getBrlAccountBalance(accountId) {
    try {
      const response = await axios.get(`/api/accounts/brl/${accountId}/balance`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter saldo da conta BRL:', error);
      throw error;
    }
  }
  
  /**
   * Simular conversão de moeda
   * @param {number} amount - Valor a ser convertido
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<Object>} - Resultado da simulação
   */
  async simulateCurrencyConversion(amount, fromCurrency, toCurrency) {
    try {
      const response = await axios.post('/api/currency-transfer/simulate', {
        amount,
        fromCurrency,
        toCurrency
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao simular conversão de moeda:', error);
      throw error;
    }
  }
  
  /**
   * Obter taxa de câmbio entre duas moedas
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<Object>} - Taxa de câmbio
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const response = await axios.get(`/api/currency-transfer/rate/${fromCurrency}/${toCurrency}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter taxa de câmbio:', error);
      throw error;
    }
  }
  
  /**
   * Executar transferência entre contas de moedas diferentes
   * @param {string} fromAccountId - ID da conta de origem
   * @param {string} toAccountId - ID da conta de destino
   * @param {number} amount - Valor a ser transferido
   * @param {string} description - Descrição da transferência
   * @returns {Promise<Object>} - Resultado da transferência
   */
  async executeCurrencyTransfer(fromAccountId, toAccountId, amount, description) {
    try {
      const response = await axios.post('/api/currency-transfer/execute', {
        fromAccountId,
        toAccountId,
        amount,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao executar transferência entre moedas:', error);
      throw error;
    }
  }
}

module.exports = new AccountService();
