const jwt = require('jsonwebtoken');
const { User } = require('../pg-models');
require('dotenv').config();

/**
 * Middleware para verificar token JWT para usuários internos (PostgreSQL)
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Em ambiente de desenvolvimento, permitir acesso sem token
    if (process.env.NODE_ENV === 'development') {
      console.log('Ambiente de desenvolvimento: Ignorando verificação de token');
      // Adicionar usuário simulado ao request
      req.user = {
        id: 1,
        email: 'admin@newcash.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active'
      };
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Autenticação necessária. Por favor, faça login.'
      });
    }

    // Verificar se é um token simulado do frontend (para desenvolvimento)
    if (token.startsWith('user_')) {
      // Token simulado para desenvolvimento
      const isAdmin = token.includes('admin');
      
      // Adicionar usuário simulado ao request
      req.user = {
        id: isAdmin ? 1 : 2,
        email: isAdmin ? 'admin@newcash.com' : 'cliente@newcash.com',
        name: isAdmin ? 'Admin User' : 'Cliente Teste',
        role: isAdmin ? 'admin' : 'client',
        status: 'active'
      };
      
      return next();
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verificar se o usuário ainda existe
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'O usuário associado a este token não existe mais.'
      });
    }
    
    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Sua conta está inativa ou bloqueada. Entre em contato com o suporte.'
      });
    }
    
    // Adicionar usuário ao objeto request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    };
    
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido. Por favor, faça login novamente.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro de autenticação.'
    });
  }
};

/**
 * Middleware para verificar se o usuário é administrador
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Autenticação necessária. Por favor, faça login.'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
  }
  
  next();
};

/**
 * Middleware para restringir acesso a funções específicas
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para realizar esta ação.'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar token JWT e garantir que o usuário é um administrador
 */
exports.verifyAdminToken = async (req, res, next) => {
  try {
    // Primeiro verifica o token JWT
    await exports.verifyToken(req, res, () => {
      // Token verificado, agora verifica se é administrador
      if (req.user && req.user.role === 'admin') {
        return next();
      } else {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado. Esta funcionalidade é exclusiva para administradores.'
        });
      }
    });
  } catch (error) {
    console.error('Erro na verificação de administrador:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro na autenticação de administrador',
      error: error.message
    });
  }
};
