const LoggerService = require('../services/logger.service');

/**
 * Middleware para registrar chamadas à API do FT Asset Management
 */
const apiLoggerMiddleware = () => {
  return async (req, res, next) => {
    // Armazena o tempo de início da requisição
    const startTime = Date.now();
    
    // Captura os dados originais da requisição
    const originalUrl = req.originalUrl || req.url;
    const method = req.method;
    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    };
    
    // Armazena o método original de envio de resposta
    const originalSend = res.send;
    let responseBody;
    
    // Sobrescreve o método send para capturar a resposta
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    // Quando a resposta for finalizada
    res.on('finish', () => {
      // Calcula o tempo de resposta
      const responseTime = Date.now() - startTime;
      
      // Prepara os dados da resposta
      let parsedResponseBody;
      try {
        // Tenta fazer o parse do corpo da resposta se for uma string JSON
        parsedResponseBody = typeof responseBody === 'string' 
          ? JSON.parse(responseBody) 
          : responseBody;
      } catch (error) {
        // Se não for um JSON válido, usa o corpo como está
        parsedResponseBody = responseBody;
      }
      
      // Registra a chamada de API
      LoggerService.logApiCall(
        `${method} ${originalUrl}`,
        requestData,
        parsedResponseBody,
        res.statusCode,
        responseTime,
        res.statusCode >= 400 ? new Error(`API request failed with status ${res.statusCode}`) : null
      );
    });
    
    next();
  };
};

module.exports = apiLoggerMiddleware;
