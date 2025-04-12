/**
 * Serviço para obter taxas de câmbio
 */
const axios = require('axios');
const LoggerService = require('./logger.service');

class ExchangeRateService {
  constructor() {
    this.logger = new LoggerService('ExchangeRateService');
    this.baseUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest';
    this.cache = {
      rates: {},
      lastUpdated: null
    };
    this.updateInterval = 3600000; // 1 hora em milissegundos
  }

  /**
   * Obter taxas de câmbio atualizadas
   * @param {string} baseCurrency - Moeda base para as taxas (USD, EUR, BRL)
   * @returns {Promise<Object>} - Taxas de câmbio
   */
  async getRates(baseCurrency = 'USD') {
    try {
      // Verificar se precisamos atualizar o cache
      const now = Date.now();
      if (!this.cache.lastUpdated || (now - this.cache.lastUpdated) > this.updateInterval || !this.cache.rates[baseCurrency]) {
        this.logger.info(`Atualizando taxas de câmbio para ${baseCurrency}`);
        
        const response = await axios.get(`${this.baseUrl}/${baseCurrency}`);
        
        if (response.data && response.data.rates) {
          // Atualizar o cache
          this.cache.rates[baseCurrency] = response.data.rates;
          this.cache.lastUpdated = now;
          
          this.logger.info(`Taxas de câmbio atualizadas para ${baseCurrency}`);
        } else {
          throw new Error('Formato de resposta inválido da API de taxas de câmbio');
        }
      }
      
      return this.cache.rates[baseCurrency];
    } catch (error) {
      this.logger.error(`Erro ao obter taxas de câmbio: ${error.message}`);
      
      // Retornar taxas de câmbio padrão em caso de erro
      return this.getDefaultRates(baseCurrency);
    }
  }
  
  /**
   * Obter taxa de câmbio específica
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<number>} - Taxa de câmbio
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      // Se as moedas são iguais, a taxa é 1
      if (fromCurrency === toCurrency) {
        return 1;
      }
      
      // Obter taxas com a moeda de origem como base
      const rates = await this.getRates(fromCurrency);
      
      // Retornar a taxa específica
      if (rates && rates[toCurrency]) {
        return rates[toCurrency];
      } else {
        throw new Error(`Taxa de câmbio não encontrada para ${fromCurrency} -> ${toCurrency}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao obter taxa de câmbio específica: ${error.message}`);
      
      // Retornar taxa padrão em caso de erro
      return this.getDefaultRate(fromCurrency, toCurrency);
    }
  }
  
  /**
   * Converter valor entre moedas
   * @param {number} amount - Valor a ser convertido
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<number>} - Valor convertido
   */
  async convert(amount, fromCurrency, toCurrency) {
    try {
      // Se as moedas são iguais, o valor não muda
      if (fromCurrency === toCurrency) {
        return amount;
      }
      
      // Obter a taxa de câmbio
      const rate = await this.getRate(fromCurrency, toCurrency);
      
      // Converter o valor
      return amount * rate;
    } catch (error) {
      this.logger.error(`Erro ao converter valor: ${error.message}`);
      
      // Usar taxa padrão em caso de erro
      const defaultRate = this.getDefaultRate(fromCurrency, toCurrency);
      return amount * defaultRate;
    }
  }
  
  /**
   * Obter taxas de câmbio padrão em caso de erro
   * @param {string} baseCurrency - Moeda base
   * @returns {Object} - Taxas de câmbio padrão
   */
  getDefaultRates(baseCurrency) {
    const defaultRates = {
      USD: {
        EUR: 0.92,
        BRL: 5.05,
        USDT: 1.0
      },
      EUR: {
        USD: 1.09,
        BRL: 5.50,
        USDT: 1.09
      },
      BRL: {
        USD: 0.198,
        EUR: 0.182,
        USDT: 0.198
      },
      USDT: {
        USD: 1.0,
        EUR: 0.92,
        BRL: 5.05
      }
    };
    
    return defaultRates[baseCurrency] || defaultRates.USD;
  }
  
  /**
   * Obter taxa de câmbio padrão específica em caso de erro
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @returns {number} - Taxa de câmbio padrão
   */
  getDefaultRate(fromCurrency, toCurrency) {
    const defaultRates = this.getDefaultRates(fromCurrency);
    return defaultRates[toCurrency] || 1;
  }
}

module.exports = new ExchangeRateService();
