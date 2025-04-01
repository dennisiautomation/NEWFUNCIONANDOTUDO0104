/**
 * Serviço para integração com a API FT Asset Management
 */
const axios = require('axios');
const LoggerService = require('./logger.service');

class FTApiService {
  constructor() {
    this.baseUrl = process.env.FT_API_BASE_URL;
    this.apiKey = process.env.FT_API_KEY;
    this.usdAccount = process.env.USD_ACCOUNT;
    this.eurAccount = process.env.EUR_ACCOUNT;
    
    this.logger = new LoggerService('FTApiService');
  }
  
  /**
   * Obter dados da conta USD
   * @returns {Promise<Object>} Dados da conta USD
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
   * Obter dados da conta EUR
   * @returns {Promise<Object>} Dados da conta EUR
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
   * Obter dados de uma conta específica
   * @param {string} accountNumber - Número da conta
   * @returns {Promise<Object>} Dados da conta
   */
  async getAccountData(accountNumber) {
    try {
      const url = `${this.baseUrl}/Reservation.asp?key=${this.apiKey}&account=${accountNumber}`;
      this.logger.info(`Buscando dados da conta ${accountNumber} na API FT`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.success) {
        return {
          accountNumber,
          accountType: accountNumber === this.usdAccount ? 'USD' : 'EUR',
          balance: response.data.balance || 0,
          transactions: this.formatTransactions(response.data.transactions || []),
          lastActivity: new Date().toISOString(),
          status: 'active'
        };
      } else {
        this.logger.error(`Erro ao buscar dados da conta ${accountNumber}: ${response.data?.message || 'Resposta inválida'}`);
        throw new Error(response.data?.message || 'Erro ao buscar dados da conta');
      }
    } catch (error) {
      this.logger.error(`Erro na requisição para a API FT (conta ${accountNumber}): ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Formatar transações da API FT para o formato interno
   * @param {Array} transactions - Transações da API FT
   * @returns {Array} Transações formatadas
   */
  formatTransactions(transactions) {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.map(transaction => ({
      id: transaction.id || transaction.reference || `ft-${Date.now()}`,
      type: this.mapTransactionType(transaction.type),
      amount: transaction.amount,
      date: transaction.date || new Date().toISOString(),
      description: transaction.description || 'Transação via API FT',
      status: transaction.status || 'completed',
      reference: transaction.reference
    }));
  }
  
  /**
   * Mapear tipos de transação da API FT para tipos internos
   * @param {string} ftType - Tipo de transação da API FT
   * @returns {string} Tipo de transação interno
   */
  mapTransactionType(ftType) {
    const typeMap = {
      'deposit': 'DEPOSIT',
      'withdrawal': 'WITHDRAWAL',
      'transfer': 'TRANSFER',
      'payment': 'PAYMENT',
      'reservation': 'WITHDRAWAL',
      'confirmation': 'DEPOSIT',
      'receive': 'DEPOSIT'
    };
    
    return typeMap[ftType.toLowerCase()] || 'TRANSFER';
  }
  
  /**
   * Fazer uma reserva (withdrawal) na API FT
   * @param {Object} data - Dados da reserva
   * @returns {Promise<Object>} Resultado da reserva
   */
  async makeReservation(data) {
    try {
      const url = `${this.baseUrl}/Reservation.asp?key=${this.apiKey}`;
      this.logger.info(`Fazendo reserva na API FT: ${JSON.stringify(data)}`);
      
      const response = await axios.post(url, data);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        this.logger.error(`Erro ao fazer reserva: ${response.data?.message || 'Resposta inválida'}`);
        throw new Error(response.data?.message || 'Erro ao fazer reserva');
      }
    } catch (error) {
      this.logger.error(`Erro na requisição para a API FT (reserva): ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Confirmar uma reserva na API FT
   * @param {Object} data - Dados da confirmação
   * @returns {Promise<Object>} Resultado da confirmação
   */
  async confirmReservation(data) {
    try {
      const url = `${this.baseUrl}/Reservation_confirmation.asp`;
      this.logger.info(`Confirmando reserva na API FT: ${JSON.stringify(data)}`);
      
      const response = await axios.post(url, data);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        this.logger.error(`Erro ao confirmar reserva: ${response.data?.message || 'Resposta inválida'}`);
        throw new Error(response.data?.message || 'Erro ao confirmar reserva');
      }
    } catch (error) {
      this.logger.error(`Erro na requisição para a API FT (confirmação): ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Receber uma transferência na API FT
   * @param {Object} data - Dados do recebimento
   * @returns {Promise<Object>} Resultado do recebimento
   */
  async receiveTransfer(data) {
    try {
      const url = `${this.baseUrl}/receiving.asp?key=${this.apiKey}`;
      this.logger.info(`Recebendo transferência na API FT: ${JSON.stringify(data)}`);
      
      const response = await axios.post(url, data);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        this.logger.error(`Erro ao receber transferência: ${response.data?.message || 'Resposta inválida'}`);
        throw new Error(response.data?.message || 'Erro ao receber transferência');
      }
    } catch (error) {
      this.logger.error(`Erro na requisição para a API FT (recebimento): ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get EUR account reservations
   * @returns {Promise<Object>} EUR account reservations
   */
  async getEurReservations() {
    return this.getReservations(this.eurAccount);
  }

  /**
   * Get specific reservation by code
   * @param {string} reservationCode - Reservation code
   * @returns {Promise<Object>} Reservation details
   */
  async getReservationByCode(reservationCode) {
    return this.getReservations(null, reservationCode);
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

  /**
   * Confirm a reservation
   * @param {Object} confirmationData - Confirmation data in JSON format
   */
  async confirmReservation(confirmationData) {
    try {
      const url = `${this.baseUrl}/Reservation_confirmation.asp`;
      this.logger.info(`Confirmando reserva na API FT: ${JSON.stringify(confirmationData)}`);
      
      const response = await axios.post(url, confirmationData);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        this.logger.error(`Erro ao confirmar reserva: ${response.data?.message || 'Resposta inválida'}`);
        throw new Error(response.data?.message || 'Erro ao confirmar reserva');
      }
    } catch (error) {
      this.logger.error(`Erro na requisição para a API FT (confirmação): ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FTApiService();
