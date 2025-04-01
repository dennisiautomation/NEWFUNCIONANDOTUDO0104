/**
 * Controlador de segurança simplificado que funciona sem MongoDB
 * Usado quando o sistema está operando em modo "API-only"
 */

const logs = []; // Array em memória para armazenar logs temporariamente

const SecurityMockController = {
  /**
   * Registra uma nova atividade de segurança na memória
   * @param {Object} logData - dados da atividade
   * @returns {Promise} Promessa resolvida com o log criado
   */
  logActivity: async (logData) => {
    try {
      const newLog = {
        id: Date.now().toString(),
        userId: logData.userId,
        actionType: logData.actionType,
        ipAddress: logData.ipAddress,
        details: logData.details,
        status: logData.status || 'success',
        userAgent: logData.userAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      logs.push(newLog);
      console.log('Log de segurança registrado (modo offline):', newLog.actionType);
      
      return newLog;
    } catch (error) {
      console.error('Erro ao registrar log de segurança (mock):', error);
      throw error;
    }
  },
  
  /**
   * Obtém logs de segurança com filtros opcionais (versão mock)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  getLogs: async (req, res) => {
    try {
      const { userId, actionType, status, page = 1, limit = 20 } = req.query;
      
      // Filtragem básica
      let filteredLogs = [...logs];
      
      if (userId) filteredLogs = filteredLogs.filter(log => log.userId === userId);
      if (actionType) filteredLogs = filteredLogs.filter(log => log.actionType === actionType);
      if (status) filteredLogs = filteredLogs.filter(log => log.status === status);
      
      // Ordena por data decrescente
      filteredLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Paginação simplificada
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      
      res.json({
        status: 'success',
        message: 'Operando em modo offline (sem MongoDB)',
        data: paginatedLogs,
        pagination: {
          total: filteredLogs.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filteredLogs.length / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs de segurança (mock):', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar logs de segurança',
        error: error.message
      });
    }
  },
  
  /**
   * Obtém logs de segurança de um usuário específico (versão mock)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  getUserLogs: async (req, res) => {
    try {
      const userId = req.params.userId || (req.user ? req.user._id : 'guest');
      const { page = 1, limit = 20 } = req.query;
      
      // Filtragem por usuário
      let userLogs = logs.filter(log => log.userId === userId);
      
      // Ordena por data decrescente
      userLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Paginação simplificada
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedLogs = userLogs.slice(startIndex, endIndex);
      
      res.json({
        status: 'success',
        message: 'Operando em modo offline (sem MongoDB)',
        data: paginatedLogs,
        pagination: {
          total: userLogs.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(userLogs.length / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs de segurança do usuário (mock):', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar logs de segurança do usuário',
        error: error.message
      });
    }
  }
};

module.exports = SecurityMockController;
