const axios = require('axios');
const LoggerService = require('./logger.service');
const https = require('https');

class FTApiService {
  constructor() {
    this.baseUrl = process.env.FT_API_BASE_URL || 'http://mytest.ftassetmanagement.com/api';
    this.apiKey = process.env.FT_API_KEY || '6d9bac1b-f685-11ef-a3af-00155d010b18';
    this.usdAccount = process.env.USD_ACCOUNT || '60428';
    this.eurAccount = process.env.EUR_ACCOUNT || '60429';

    // Configurar o agente HTTPS para lidar com certificados em produção
    const httpsAgent = new https.Agent({
      rejectUnauthorized: true // Validar certificados em produção
    });

    // Initialize axios instance with common configuration
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout para ambiente de produção
      headers: {
        'Accept': '*/*'
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
        console.info(`FT API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`FT API Request Error: ${error.message}`);
        LoggerService.logSystemError(error, { 
          source: 'FT API Request',
          context: 'Request Interceptor' 
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        console.info(`FT API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`FT API Response Error: ${error.response.status} ${error.response.statusText}`);
          console.error(`Error Data: ${JSON.stringify(error.response.data)}`);
          LoggerService.logSystemError(error, { 
            source: 'FT API Response',
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error(`FT API No Response: ${error.request}`);
          LoggerService.logSystemError(error, { 
            source: 'FT API Response',
            context: 'No Response',
            request: error.request
          });
        } else {
          console.error(`FT API Error: ${error.message}`);
          LoggerService.logSystemError(error, { 
            source: 'FT API Error',
            context: 'General Error'
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get reservations for an account
   * @param {string} account - Account number (optional)
   * @param {string} reservationCode - Reservation code (optional)
   * @returns {Promise<Object>} Reservation data
   */
  async getReservations(account, reservationCode) {
    const startTime = Date.now();
    try {
      // Construir a URL para a API exatamente como nos exemplos da produção
      let url = `/reservation.asp?key=${this.apiKey}`;
      
      if (account) {
        url += `&account=${account}`;
      } else if (reservationCode) {
        url += `&Res_code=${reservationCode}`;
      } else {
        throw new Error('Either account or reservation code must be provided');
      }

      console.log('URL da requisição:', url);
      console.log('URL base:', this.baseUrl);
      
      // Usar a instância this.api que já está configurada
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET /reservation.asp',
        { account, reservationCode },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting reservations: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET /reservation.asp',
        { account, reservationCode },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get USD account reservations
   * @returns {Promise<Object>} USD account reservations
   */
  async getUsdReservations() {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/reservation.asp?key=${this.apiKey}&account=${this.usdAccount}`;
      console.log('URL da requisição USD:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Reservations',
        { account: this.usdAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting USD reservations: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Reservations',
        { account: this.usdAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get EUR account reservations
   * @returns {Promise<Object>} EUR account reservations
   */
  async getEurReservations() {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/reservation.asp?key=${this.apiKey}&account=${this.eurAccount}`;
      console.log('URL da requisição EUR:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Reservations',
        { account: this.eurAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting EUR reservations: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Reservations',
        { account: this.eurAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get specific reservation by code
   * @param {string} reservationCode - Reservation code
   * @returns {Promise<Object>} Reservation details
   */
  async getReservationByCode(reservationCode) {
    try {
      // Usar a URL exata conforme a produção
      return this.getReservations(null, reservationCode);
    } catch (error) {
      console.error(`Error getting reservation by code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirm a reservation
   * @param {string} refNum - Reference number 
   * @param {string} status - Status (accepted/rejected)
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmReservation(refNum, status) {
    const startTime = Date.now();
    try {
      if (!refNum || !status) {
        throw new Error('RefNum e status são obrigatórios para confirmar reserva');
      }
      
      // Validar status
      if (!['accepted', 'rejected'].includes(status.toLowerCase())) {
        throw new Error('Status deve ser "accepted" ou "rejected"');
      }
      
      // Log de ação importante
      console.log(`🔔 CONFIRMANDO RESERVA EM PRODUÇÃO: ${refNum} com status ${status}`);
      console.log(`⚠️ ESTA AÇÃO TEM IMPACTO FINANCEIRO REAL!`);
      
      // Dados da confirmação seguindo o formato exato especificado pela FT
      const confirmationData = {
        Details: {
          authToken: this.apiKey,
          Res_code: refNum,
          DateTime: new Date().toISOString(),
          AccountNumber: status.toLowerCase() === 'accepted' ? this.usdAccount : null,
          Amount: status.toLowerCase() === 'accepted' ? "100" : "0"
        }
      };
      
      // Log dos dados sendo enviados (sem chaves sensíveis)
      const logSafeData = JSON.parse(JSON.stringify(confirmationData));
      logSafeData.Details.authToken = '***OMITIDO***';
      console.log('Dados da confirmação:', JSON.stringify(logSafeData, null, 2));
      
      // Confirmar com o operador antes de prosseguir com a ação (em produção)
      // Nota: Este é um check extra, que seria substituído por uma confirmação UI
      console.log('ATENÇÃO: Esta operação afetará contas reais em produção.');
      
      // URL para confirmação de reserva
      const url = `/reservation_confirmation.asp`;
      
      // Realizar a requisição de confirmação
      const response = await this.api.post(url, confirmationData);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'POST /reservation_confirmation.asp',
        confirmationData,
        response.data,
        response.status,
        responseTime
      );
      
      return {
        result: response.data,
        confirmation: {
          refNum,
          status,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error confirming reservation: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'POST /reservation_confirmation.asp',
        { refNum, status },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Check for incoming transfers
   * @returns {Promise<Object>} Incoming transfers data
   */
  async checkIncomingTransfers() {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/receiving.asp?key=${this.apiKey}`;
      console.log('URL da requisição de transferências recebidas:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET /receiving.asp',
        {},
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error checking incoming transfers: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET /receiving.asp',
        {},
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      // Se o erro for 500, retornar objeto vazio simulando "sem transferências"
      // Este é um tratamento temporário para o erro 500 na API de recebimento
      if (error.response && error.response.status === 500) {
        console.log('API de recebimento retornou erro 500. Retornando objeto vazio temporário.');
        return {
          Information: {
            Info: "API currently unavailable. No new transfers processed."
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Send a transfer to another financial entity
   * @param {Object} transferData - Transfer data in JSON format
   * @returns {Promise<Object>} Transfer response
   */
  async sendTransfer(transferData) {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/send.asp?key=${this.apiKey}`;
      
      // Ensure required fields are present
      if (!transferData.amount || !transferData.currency || !transferData.destinationAccount) {
        throw new Error('Amount, currency, and destination account are required');
      }

      const response = await this.api.post(url, transferData);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'POST /send.asp',
        { ...transferData, key: this.apiKey },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error sending transfer: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'POST /send.asp',
        { ...transferData, key: this.apiKey },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get USD account data
   * @returns {Promise<Object>} USD account data
   */
  async getUSDAccountData() {
    const startTime = Date.now();
    try {
      // Obter reservas da conta USD para extrair saldo
      const reservationData = await this.getUsdReservations();
      
      // Extrair saldo e outras informações relevantes
      const accountData = {
        accountNumber: this.usdAccount,
        balance: reservationData.balance || 0,
        currency: 'USD',
        status: 'active',
        lastUpdated: new Date().toISOString()
      };
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Account Data',
        { account: this.usdAccount },
        accountData,
        200,
        responseTime
      );
      
      return accountData;
    } catch (error) {
      console.error(`Error getting USD account data: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Account Data',
        { account: this.usdAccount },
        {},
        500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get EUR account data
   * @returns {Promise<Object>} EUR account data
   */
  async getEURAccountData() {
    const startTime = Date.now();
    try {
      // Obter reservas da conta EUR para extrair saldo
      const reservationData = await this.getEurReservations();
      
      // Extrair saldo e outras informações relevantes
      const accountData = {
        accountNumber: this.eurAccount,
        balance: reservationData.balance || 0,
        currency: 'EUR',
        status: 'active',
        lastUpdated: new Date().toISOString()
      };
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Account Data',
        { account: this.eurAccount },
        accountData,
        200,
        responseTime
      );
      
      return accountData;
    } catch (error) {
      console.error(`Error getting EUR account data: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Account Data',
        { account: this.eurAccount },
        {},
        500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get account transactions
   * @param {string} accountNumber - Account number
   * @returns {Promise<Object>} Transaction data
   */
  async getAccountTransactions(accountNumber) {
    const startTime = Date.now();
    try {
      // Verificar qual conta está sendo consultada
      const isUsdAccount = accountNumber === this.usdAccount;
      const isEurAccount = accountNumber === this.eurAccount;
      
      if (!isUsdAccount && !isEurAccount) {
        throw new Error(`Invalid account number: ${accountNumber}`);
      }
      
      // Obter reservas da conta para extrair transações
      const reservationData = isUsdAccount 
        ? await this.getUsdReservations() 
        : await this.getEurReservations();
      
      // Processar dados de transações
      const transactions = this.processTransactionsFromReservations(reservationData, isUsdAccount ? 'USD' : 'EUR');
      
      const transactionData = {
        accountNumber,
        currency: isUsdAccount ? 'USD' : 'EUR',
        transactions
      };
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET Account Transactions',
        { account: accountNumber },
        { transactionCount: transactions.length },
        200,
        responseTime
      );
      
      return transactionData;
    } catch (error) {
      console.error(`Error getting account transactions: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET Account Transactions',
        { account: accountNumber },
        {},
        500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get USD account transactions
   * @returns {Promise<Object>} USD account transactions
   */
  async getUsdTransactions() {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/reservation.asp?key=${this.apiKey}&account=${this.usdAccount}`;
      console.log('URL da requisição de transações USD:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Transactions',
        { account: this.usdAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting USD transactions: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET USD Transactions',
        { account: this.usdAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Get EUR account transactions
   * @returns {Promise<Object>} EUR account transactions
   */
  async getEurTransactions() {
    const startTime = Date.now();
    try {
      // Usar a URL exata conforme a produção
      const url = `/reservation.asp?key=${this.apiKey}&account=${this.eurAccount}`;
      console.log('URL da requisição de transações EUR:', url);
      
      const response = await this.api.get(url);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Transactions',
        { account: this.eurAccount },
        response.data,
        response.status,
        responseTime
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting EUR transactions: ${error.message}`);
      
      // Log failed API call
      const responseTime = Date.now() - startTime;
      LoggerService.logApiCall(
        'GET EUR Transactions',
        { account: this.eurAccount },
        error.response?.data || {},
        error.response?.status || 500,
        responseTime,
        error
      );
      
      throw error;
    }
  }

  /**
   * Process transactions from reservation data
   * @param {Object} reservationData - Reservation data
   * @param {string} currency - Currency code (USD or EUR)
   * @returns {Array} Processed transactions
   */
  processTransactionsFromReservations(reservationData, currency) {
    if (!reservationData || !reservationData.reservations || !Array.isArray(reservationData.reservations)) {
      return [];
    }
    
    // Mapear reservas para o formato de transações
    return reservationData.reservations.map((reservation, index) => {
      const isPositive = reservation.type === 'receive' || reservation.type === 'confirmation';
      
      return {
        id: reservation.id || reservation.code || `trans-${Date.now()}-${index}`,
        type: this.mapReservationTypeToTransactionType(reservation.type),
        amount: isPositive ? Math.abs(reservation.amount || 0) : -Math.abs(reservation.amount || 0),
        date: reservation.date || new Date().toISOString(),
        description: reservation.description || `${this.capitalizeFirstLetter(reservation.type || 'Transaction')} - ${reservation.code || ''}`,
        status: reservation.status || 'completed',
        currency
      };
    });
  }

  /**
   * Map reservation type to transaction type
   * @param {string} reservationType - Reservation type
   * @returns {string} Transaction type
   */
  mapReservationTypeToTransactionType(reservationType) {
    if (!reservationType) return 'TRANSFER';
    
    const typeMap = {
      'deposit': 'DEPOSIT',
      'withdrawal': 'WITHDRAWAL',
      'transfer': 'TRANSFER',
      'payment': 'PAYMENT',
      'reservation': 'WITHDRAWAL',
      'confirmation': 'DEPOSIT',
      'receive': 'DEPOSIT'
    };
    
    return typeMap[reservationType.toLowerCase()] || 'TRANSFER';
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

module.exports = new FTApiService();
