const LoggerService = require('../services/logger.service');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware para registrar atividades de usuários
 * Captura informações do usuário autenticado e registra suas ações
 */
const userActivityMiddleware = (action) => {
  return async (req, res, next) => {
    try {
      // Em ambiente de desenvolvimento, ignorar o registro de atividades
      if (process.env.NODE_ENV === 'development') {
        console.log(`Ambiente de desenvolvimento: Ignorando registro de atividade "${action}"`);
        return next();
      }
      
      // Extrai o token de autenticação do cabeçalho
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        let userId = 'unknown';
        
        // Verifica se é um token simulado
        if (token.startsWith('user_')) {
          userId = token.includes('admin') ? 'admin-user' : 'client-user';
        } else {
          try {
            // Decodifica o token para obter o ID do usuário
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'newcashbank-migration-secret-2025');
            userId = decoded.id;
          } catch (jwtError) {
            console.error('Erro ao decodificar token para atividade:', jwtError.message);
          }
        }
        
        // Registra a atividade do usuário
        try {
          await LoggerService.logUserActivity({
            userId,
            action,
            details: {
              method: req.method,
              path: req.originalUrl,
              params: req.params,
              query: req.query,
              body: req.method === 'GET' ? undefined : req.body, // Não logar o body para requisições GET
              userAgent: req.headers['user-agent'],
              ip: req.ip || req.connection.remoteAddress
            }
          });
        } catch (logError) {
          // Não bloquear a requisição se houver erro no log
          console.error('Erro ao registrar atividade:', logError.message);
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de atividade do usuário:', error);
      next(); // Continua mesmo com erro para não bloquear a requisição
    }
  };
};

module.exports = userActivityMiddleware;
