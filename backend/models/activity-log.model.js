const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'login', 'logout', 'failed_login',
      'account_view', 'account_create', 'account_update', 'account_status_change',
      'transfer_initiate', 'transfer_complete', 'transfer_fail', 'transfer_cancel',
      'reservation_create', 'reservation_confirm', 'reservation_cancel', 'reservation_expire',
      'api_call', 'api_response', 'api_error',
      'system_error', 'security_alert'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Para chamadas de API, armazenamos informações específicas
  apiEndpoint: {
    type: String,
    trim: true
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed
  },
  responseTime: {
    type: Number // em milissegundos
  },
  statusCode: {
    type: Number
  },
  errorMessage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes para consultas mais rápidas
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ account: 1, createdAt: -1 });
activityLogSchema.index({ transaction: 1 });
activityLogSchema.index({ reservation: 1 });
activityLogSchema.index({ apiEndpoint: 1, createdAt: -1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });

// Método estático para registrar atividade de usuário
activityLogSchema.statics.logUserActivity = function(action, userId, details = {}, req = null) {
  const logData = {
    action,
    user: userId,
    details
  };
  
  if (req) {
    logData.ipAddress = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.headers['user-agent'];
  }
  
  return this.create(logData);
};

// Método estático para registrar atividade de conta
activityLogSchema.statics.logAccountActivity = function(action, accountId, userId = null, details = {}) {
  return this.create({
    action,
    account: accountId,
    user: userId,
    details
  });
};

// Método estático para registrar atividade de transação
activityLogSchema.statics.logTransactionActivity = function(action, transactionId, userId = null, details = {}) {
  return this.create({
    action,
    transaction: transactionId,
    user: userId,
    details
  });
};

// Método estático para registrar chamadas de API
activityLogSchema.statics.logApiCall = function(endpoint, requestData, responseData, statusCode, responseTime, error = null) {
  const logData = {
    action: error ? 'api_error' : 'api_response',
    apiEndpoint: endpoint,
    requestData,
    responseData,
    statusCode,
    responseTime
  };
  
  if (error) {
    logData.errorMessage = error.message || String(error);
    logData.details.stack = error.stack;
  }
  
  return this.create(logData);
};

// Método estático para registrar erros do sistema
activityLogSchema.statics.logSystemError = function(errorMessage, details = {}) {
  return this.create({
    action: 'system_error',
    errorMessage,
    details
  });
};

// Método estático para registrar alertas de segurança
activityLogSchema.statics.logSecurityAlert = function(details, userId = null, ipAddress = null) {
  return this.create({
    action: 'security_alert',
    user: userId,
    ipAddress,
    details
  });
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
