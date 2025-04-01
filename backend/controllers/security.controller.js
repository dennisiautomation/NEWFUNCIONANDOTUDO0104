const SecurityLog = require('../models/security-log.model');

/**
 * Controller para gerenciar logs de segurança
 */
const SecurityController = {
  /**
   * Registra uma nova atividade de segurança
   * @param {Object} logData - dados da atividade
   * @returns {Promise} Promessa resolvida com o log criado
   */
  logActivity: async (logData) => {
    try {
      const newLog = new SecurityLog({
        userId: logData.userId,
        actionType: logData.actionType,
        ipAddress: logData.ipAddress,
        details: logData.details,
        status: logData.status || 'success',
        userAgent: logData.userAgent
      });
      
      return await newLog.save();
    } catch (error) {
      console.error('Erro ao registrar log de segurança:', error);
      throw error;
    }
  },
  
  /**
   * Obtém logs de segurança com filtros opcionais
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  getLogs: async (req, res) => {
    try {
      const { userId, actionType, startDate, endDate, status, page = 1, limit = 20 } = req.query;
      
      // Construindo filtros
      const filter = {};
      
      if (userId) filter.userId = userId;
      if (actionType) filter.actionType = actionType;
      if (status) filter.status = status;
      
      // Filtragem por data
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Paginação
      const skip = (page - 1) * limit;
      
      // Consulta ao banco de dados
      const logs = await SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email');
      
      const totalLogs = await SecurityLog.countDocuments(filter);
      
      res.json({
        status: 'success',
        data: logs,
        pagination: {
          total: totalLogs,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalLogs / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs de segurança:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar logs de segurança',
        error: error.message
      });
    }
  },
  
  /**
   * Obtém logs de segurança de um usuário específico
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  getUserLogs: async (req, res) => {
    try {
      const userId = req.params.userId || req.user._id;
      const { page = 1, limit = 20 } = req.query;
      
      // Paginação
      const skip = (page - 1) * limit;
      
      // Consulta ao banco de dados
      const logs = await SecurityLog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      const totalLogs = await SecurityLog.countDocuments({ userId });
      
      res.json({
        status: 'success',
        data: logs,
        pagination: {
          total: totalLogs,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalLogs / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs de segurança do usuário:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar logs de segurança do usuário',
        error: error.message
      });
    }
  }
};

module.exports = SecurityController;
