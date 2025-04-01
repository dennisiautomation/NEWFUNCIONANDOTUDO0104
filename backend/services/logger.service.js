const ActivityLog = require('../models/activity-log.model');

/**
 * Serviço para gerenciar logs de atividades do sistema
 */
class LoggerService {
  static isDbConnected = false;

  /**
   * Define o status da conexão com o banco de dados
   * @param {Boolean} status - Status da conexão
   */
  static setDbConnectionStatus(status) {
    this.isDbConnected = status;
  }

  /**
   * Registra uma atividade de usuário
   * @param {Object} params - Parâmetros da atividade
   * @param {String} params.userId - ID do usuário
   * @param {String} params.action - Tipo de ação realizada
   * @param {Object} params.details - Detalhes adicionais da ação
   */
  static async logUserActivity(params) {
    try {
      const { userId, action, details = {} } = params;
      
      if (!this.isDbConnected) {
        console.log(`[LOG] User Activity: ${action} | User: ${userId}`);
        return;
      }
      
      // Se ainda estamos usando o modelo antigo do MongoDB
      if (typeof ActivityLog.logUserActivity === 'function') {
        await ActivityLog.logUserActivity(action, userId, details);
      } else {
        // Compatibilidade para caso o modelo antigo não exista ou tenha mudado
        console.log(`[LOG] User Activity: ${action} | User: ${userId} | Details:`, details);
      }
    } catch (error) {
      console.error('Erro ao registrar atividade de usuário:', error);
    }
  }

  /**
   * Registra uma atividade relacionada a uma conta
   * @param {String} action - Tipo de ação realizada
   * @param {String} accountId - ID da conta
   * @param {String} userId - ID do usuário (opcional)
   * @param {Object} details - Detalhes adicionais da ação
   */
  static async logAccountActivity(action, accountId, userId = null, details = {}) {
    try {
      if (!this.isDbConnected) {
        console.log(`[LOG] Account Activity: ${action} | Account: ${accountId}`);
        return;
      }
      await ActivityLog.logAccountActivity(action, accountId, userId, details);
    } catch (error) {
      console.error('Erro ao registrar atividade de conta:', error);
    }
  }

  /**
   * Registra uma atividade de segurança
   * @param {String} action - Tipo de ação realizada
   * @param {String} userId - ID do usuário (se aplicável)
   * @param {Object} details - Detalhes adicionais da ação
   * @param {String} ip - Endereço IP (opcional)
   */
  static async logSecurityActivity(action, userId = null, details = {}, ip = null) {
    try {
      if (!this.isDbConnected) {
        console.log(`[LOG] Security Activity: ${action} | User: ${userId || 'N/A'}`);
        return;
      }
      await ActivityLog.logSecurityActivity(action, userId, details, ip);
    } catch (error) {
      console.error('Erro ao registrar atividade de segurança:', error);
    }
  }

  /**
   * Registra uma atividade do sistema
   * @param {String} action - Tipo de ação realizada
   * @param {Object} details - Detalhes adicionais da ação
   */
  static async logSystemActivity(action, details = {}) {
    try {
      if (!this.isDbConnected) {
        console.log(`[LOG] System Activity: ${action}`);
        return;
      }
      await ActivityLog.logSystemActivity(action, details);
    } catch (error) {
      console.error('Erro ao registrar atividade do sistema:', error);
    }
  }

  /**
   * Registra uma atividade geral
   * @param {String} type - Tipo de log (info, warning, error)
   * @param {String} message - Mensagem principal
   * @param {Object} data - Dados adicionais
   */
  static async log(type, message, data = {}) {
    try {
      if (!this.isDbConnected) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
      }
      await ActivityLog.createLog(type, message, data);
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }

  // Atalhos para tipos comuns de logs

  /**
   * Registra log de informação
   * @param {String} message - Mensagem de informação
   * @param {Object} data - Dados adicionais
   */
  static async info(message, data = {}) {
    await this.log('info', message, data);
  }

  /**
   * Registra log de aviso
   * @param {String} message - Mensagem de aviso
   * @param {Object} data - Dados adicionais
   */
  static async warning(message, data = {}) {
    await this.log('warning', message, data);
  }

  /**
   * Registra log de erro
   * @param {String} message - Mensagem de erro
   * @param {Object} data - Dados adicionais
   */
  static async error(message, data = {}) {
    await this.log('error', message, data);
  }

  /**
   * Registra log de debug (apenas em desenvolvimento)
   * @param {String} message - Mensagem de debug
   * @param {Object} data - Dados adicionais
   */
  static async debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      await this.log('debug', message, data);
    }
  }

  /**
   * Registra uma chamada de API
   * @param {String} endpoint - Endpoint da API
   * @param {Object} requestData - Dados da requisição
   * @param {Object} responseData - Dados da resposta
   * @param {Number} statusCode - Código de status HTTP
   * @param {Number} responseTime - Tempo de resposta em ms
   * @param {Error} error - Objeto de erro (opcional)
   */
  static async logApiCall(endpoint, requestData, responseData, statusCode, responseTime, error = null) {
    try {
      if (!this.isDbConnected) {
        console.log(`[LOG] API Call: ${endpoint} | Status: ${statusCode} | Time: ${responseTime}ms`);
        return;
      }
      // Sanitiza os dados de requisição e resposta para remover informações sensíveis
      const sanitizedRequestData = this.sanitizeData(requestData);
      const sanitizedResponseData = this.sanitizeData(responseData);
      
      await ActivityLog.logApiCall(
        endpoint,
        sanitizedRequestData,
        sanitizedResponseData,
        statusCode,
        responseTime,
        error
      );
    } catch (error) {
      console.error('Erro ao registrar chamada de API:', error);
    }
  }

  /**
   * Registra um erro do sistema
   * @param {String|Error} error - Mensagem de erro ou objeto Error
   * @param {Object} details - Detalhes adicionais do erro
   */
  static async logSystemError(error, details = {}) {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!this.isDbConnected) {
        console.error(`[LOG] System Error: ${errorMessage}`);
        return;
      }
      
      const errorDetails = error instanceof Error 
        ? { ...details, stack: error.stack } 
        : details;
      
      await ActivityLog.logSystemError(errorMessage, errorDetails);
    } catch (err) {
      console.error('Erro ao registrar erro do sistema:', err);
    }
  }

  /**
   * Registra um alerta de segurança
   * @param {Object} details - Detalhes do alerta
   * @param {String} userId - ID do usuário (opcional)
   * @param {String} ipAddress - Endereço IP (opcional)
   */
  static async logSecurityAlert(details, userId = null, ipAddress = null) {
    try {
      if (!this.isDbConnected) {
        console.log(`[LOG] Security Alert | User: ${userId || 'N/A'} | IP: ${ipAddress || 'N/A'}`);
        return;
      }
      await ActivityLog.logSecurityAlert(details, userId, ipAddress);
    } catch (error) {
      console.error('Erro ao registrar alerta de segurança:', error);
    }
  }

  /**
   * Sanitiza dados para remover informações sensíveis antes de armazenar nos logs
   * @param {Object} data - Dados a serem sanitizados
   * @returns {Object} Dados sanitizados
   */
  static sanitizeData(data) {
    if (!data) return data;
    
    // Cria uma cópia para não modificar o objeto original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Lista de campos sensíveis a serem mascarados
    const sensitiveFields = [
      'password', 'senha', 'token', 'apiKey', 'api_key', 'secret',
      'cardNumber', 'cvv', 'securityCode', 'pin'
    ];
    
    // Função recursiva para sanitizar objetos aninhados
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Se for um campo sensível, substitui o valor
        if (sensitiveFields.includes(key.toLowerCase())) {
          obj[key] = '******';
        } 
        // Se for um objeto ou array, processa recursivamente
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }
}

module.exports = LoggerService;
