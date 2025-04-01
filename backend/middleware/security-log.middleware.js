const SecurityController = require('../controllers/security.controller');

/**
 * Middleware para registrar automaticamente atividades de segurança
 * @param {String} actionType - Tipo de ação a ser registrada  
 * @returns {Function} Middleware do Express
 */
const securityLogMiddleware = (actionType) => {
  return async (req, res, next) => {
    // Guardar o método res.json original
    const originalJson = res.json;
    
    // Sobrescrever o método res.json
    res.json = function(data) {
      // Restaurar o método original para evitar recursão
      res.json = originalJson;
      
      // Após enviar a resposta, registrar log
      const logData = {
        userId: req.user._id,
        actionType: actionType,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: actionType.includes('login') ? { email: req.body.email } : req.body,
          status: data.status
        },
        status: data.status === 'error' ? 'failed' : 'success'
      };
      
      // Remover dados sensíveis dos detalhes
      if (logData.details.body && logData.details.body.password) {
        delete logData.details.body.password;
      }
      
      // Limitar o tamanho dos detalhes para evitar documentos muito grandes
      logData.details = JSON.stringify(logData.details).slice(0, 5000);
      
      // Registrar a atividade de forma assíncrona (não bloqueia a resposta)
      SecurityController.logActivity(logData)
        .catch(err => console.error('Erro ao registrar log de segurança:', err));
      
      // Chamar o método json original
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = securityLogMiddleware;
