const ActivityLog = require('../models/activity-log.model');
const LoggerService = require('../services/logger.service');

/**
 * Controlador para gerenciamento de logs de atividades
 */
class ActivityLogController {
  /**
   * Obtém logs de atividades com filtros e paginação
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        startDate,
        endDate,
        userId,
        action,
        severity
      } = req.query;

      // Constrói o filtro baseado nos parâmetros da requisição
      const filter = {};
      
      if (type) filter.type = type;
      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (severity) filter.severity = severity;
      
      // Filtro de data
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      // Executa a consulta com paginação
      const options = {
        sort: { timestamp: -1 }, // Ordena do mais recente para o mais antigo
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      // Obtém os logs e a contagem total
      const [logs, total] = await Promise.all([
        ActivityLog.find(filter, null, options),
        ActivityLog.countDocuments(filter)
      ]);

      // Registra a atividade de visualização de logs
      LoggerService.logUserActivity(
        'view_activity_logs',
        req.user.id,
        { filter, page, limit }
      );

      // Retorna os logs com informações de paginação
      res.json({
        status: 'success',
        data: {
          logs,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'ActivityLogController.getLogs',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter logs de atividades',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas dos logs de atividades
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async getLogStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Filtro de data
      const dateFilter = {};
      if (startDate || endDate) {
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
      }

      // Pipeline de agregação para estatísticas
      const pipeline = [
        // Filtro de data se especificado
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
        
        // Estatísticas por tipo de log
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        
        // Formata o resultado
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1
          }
        },
        
        // Ordena por contagem (decrescente)
        {
          $sort: { count: -1 }
        }
      ];

      // Executa a agregação
      const typeStats = await ActivityLog.aggregate(pipeline);

      // Agregação para estatísticas por severidade
      const severityPipeline = [
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            severity: '$_id',
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      const severityStats = await ActivityLog.aggregate(severityPipeline);

      // Agregação para estatísticas por ação (top 10)
      const actionPipeline = [
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            action: '$_id',
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ];

      const actionStats = await ActivityLog.aggregate(actionPipeline);

      // Registra a atividade de visualização de estatísticas
      LoggerService.logUserActivity(
        'view_log_statistics',
        req.user.id,
        { startDate, endDate }
      );

      // Retorna as estatísticas
      res.json({
        status: 'success',
        data: {
          byType: typeStats,
          bySeverity: severityStats,
          topActions: actionStats
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'ActivityLogController.getLogStats',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao obter estatísticas de logs',
        error: error.message
      });
    }
  }

  /**
   * Limpa logs antigos com base em critérios
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async cleanupLogs(req, res) {
    try {
      const { olderThan, types, severity } = req.body;
      
      if (!olderThan) {
        return res.status(400).json({
          status: 'error',
          message: 'O parâmetro olderThan é obrigatório'
        });
      }

      // Constrói o filtro para limpeza
      const filter = {
        timestamp: { $lt: new Date(olderThan) }
      };
      
      if (types && types.length > 0) {
        filter.type = { $in: types };
      }
      
      if (severity) {
        filter.severity = severity;
      }

      // Executa a limpeza
      const result = await ActivityLog.deleteMany(filter);

      // Registra a atividade de limpeza
      LoggerService.logUserActivity(
        'cleanup_logs',
        req.user.id,
        {
          olderThan,
          types,
          severity,
          deletedCount: result.deletedCount
        }
      );

      res.json({
        status: 'success',
        message: `${result.deletedCount} logs foram removidos com sucesso`,
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'ActivityLogController.cleanupLogs',
        body: req.body
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao limpar logs',
        error: error.message
      });
    }
  }

  /**
   * Exporta logs para um formato específico (JSON ou CSV)
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  async exportLogs(req, res) {
    try {
      const {
        format = 'json',
        startDate,
        endDate,
        type,
        userId,
        action,
        severity
      } = req.query;

      // Constrói o filtro baseado nos parâmetros da requisição
      const filter = {};
      
      if (type) filter.type = type;
      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (severity) filter.severity = severity;
      
      // Filtro de data
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      // Obtém os logs
      const logs = await ActivityLog.find(filter).sort({ timestamp: -1 });

      // Registra a atividade de exportação
      LoggerService.logUserActivity(
        'export_logs',
        req.user.id,
        { format, filter }
      );

      if (format.toLowerCase() === 'csv') {
        // Converte para CSV
        const fields = ['type', 'action', 'userId', 'severity', 'timestamp', 'details'];
        let csv = fields.join(',') + '\n';
        
        logs.forEach(log => {
          const row = fields.map(field => {
            if (field === 'details') {
              return `"${JSON.stringify(log[field]).replace(/"/g, '""')}"`;
            } else if (field === 'timestamp') {
              return log[field] ? new Date(log[field]).toISOString() : '';
            } else {
              return log[field] ? `"${String(log[field]).replace(/"/g, '""')}"` : '';
            }
          });
          csv += row.join(',') + '\n';
        });

        // Define os cabeçalhos para download do CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
        
        // Envia o CSV
        return res.send(csv);
      } else {
        // Formato JSON (padrão)
        res.json({
          status: 'success',
          data: {
            logs,
            count: logs.length
          }
        });
      }
    } catch (error) {
      LoggerService.logSystemError(error, {
        context: 'ActivityLogController.exportLogs',
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Erro ao exportar logs',
        error: error.message
      });
    }
  }
}

module.exports = new ActivityLogController();
