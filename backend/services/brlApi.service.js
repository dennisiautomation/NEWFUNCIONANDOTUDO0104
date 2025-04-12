const axios = require('axios');
const LoggerService = require('./logger.service');
const https = require('https');

class BRLApiService {
  constructor() {
    this.baseUrl = process.env.BRL_API_BASE_URL || 'http://api.banco.com.br/api';
    this.apiKey = process.env.BRL_API_KEY || 'chave-api-padrao';
    this.brlAccount = process.env.BRL_ACCOUNT || '60431';

    // Configurar o agente HTTPS para lidar com certificados em produção
    const httpsAgent = new https.Agent({
      rejectUnauthorized: true // Validar certificados em produção
    });

    // Initialize axios instance with common configuration
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout para ambiente de produção
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${this.apiKey}`
      },
      httpsAgent // Adicionar o agente HTTPS para suporte SSL
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        const requestInfo = {
          method: config.method.toUpperCase(),
          url: config.url,
          data: config.data,
          params: config.params
        };
        console.info(`BRL API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`BRL API Request Error: ${error.message}`);
        LoggerService.logSystemError(error, { 
          source: 'BRL API Request',
          context: 'Request Interceptor' 
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        console.info(`BRL API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`BRL API Response Error: ${error.response.status} ${error.response.statusText}`);
          console.error(`Error Data: ${JSON.stringify(error.response.data)}`);
          LoggerService.logSystemError(error, { 
            source: 'BRL API Response',
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error(`BRL API No Response: ${error.request}`);
          LoggerService.logSystemError(error, { 
            source: 'BRL API Response',
            context: 'No Response',
            request: error.request
          });
        } else {
          console.error(`BRL API Error: ${error.message}`);
          LoggerService.logSystemError(error, { 
            source: 'BRL API Error',
            context: 'General Error'
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get BRL account balance
   * @returns {Promise<Object>} BRL account balance
   */
  async getBrlBalance() {
    const startTime = Date.now();
    try {
      const url = `/accounts/${this.brlAccount}/balance`;
      console.log('URL da requisição de saldo BRL:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET BRL Balance',
        { account: this.brlAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting BRL balance: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET BRL Balance',
        { account: this.brlAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get BRL account transactions
   * @returns {Promise<Object>} BRL account transactions
   */
  async getBrlTransactions() {
    const startTime = Date.now();
    try {
      const url = `/accounts/${this.brlAccount}/transactions`;
      console.log('URL da requisição de transações BRL:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET BRL Transactions',
        { account: this.brlAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting BRL transactions: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET BRL Transactions',
        { account: this.brlAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Process transactions from API data
   * @param {Object} transactionData - Transaction data
   * @returns {Array} Processed transactions
   */
  processTransactions(transactionData) {
    if (!transactionData || !transactionData.transactions || !Array.isArray(transactionData.transactions)) {
      return [];
    }
    
    // Mapear transações para o formato padrão do sistema
    return transactionData.transactions.map((transaction, index) => {
      const isPositive = transaction.type === 'credit' || transaction.type === 'deposit';
      
      return {
        id: transaction.id || `trans-${Date.now()}-${index}`,
        type: this.mapTransactionType(transaction.type),
        amount: isPositive ? Math.abs(transaction.amount || 0) : -Math.abs(transaction.amount || 0),
        date: transaction.date || new Date().toISOString(),
        description: transaction.description || `${this.capitalizeFirstLetter(transaction.type || 'Transaction')}`,
        status: transaction.status || 'completed',
        currency: 'BRL'
      };
    });
  }

  /**
   * Map transaction type to standard format
   * @param {string} transactionType - Transaction type
   * @returns {string} Standardized transaction type
   */
  mapTransactionType(transactionType) {
    if (!transactionType) return 'TRANSFER';
    
    const typeMap = {
      'credit': 'DEPOSIT',
      'debit': 'WITHDRAWAL',
      'deposit': 'DEPOSIT',
      'withdrawal': 'WITHDRAWAL',
      'transfer': 'TRANSFER',
      'payment': 'PAYMENT'
    };
    
    return typeMap[transactionType.toLowerCase()] || 'TRANSFER';
  }

  /**
   * Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new BRLApiService();
