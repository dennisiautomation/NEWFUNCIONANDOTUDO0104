const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'newcashbank-jwt-secret-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware para verificar token JWT
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado. Token não fornecido.'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Token inválido ou expirado'
        });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error(`Erro na autenticação: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno na autenticação'
    });
  }
};

/**
 * Middleware para verificar token JWT de administrador
 */
const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado. Token não fornecido.'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Token inválido ou expirado'
        });
      }
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso proibido. Permissão de administrador necessária.'
        });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error(`Erro na autenticação de admin: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno na autenticação'
    });
  }
};

/**
 * Gerar token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'client'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = {
  verifyToken,
  verifyAdminToken,
  generateToken
};
