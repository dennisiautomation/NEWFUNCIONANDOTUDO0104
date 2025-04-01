const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema para logs de segurança do sistema
 */
const SecurityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'login', 
      'logout', 
      'login_failed', 
      'transfer_initiated', 
      'transfer_completed',
      'transfer_failed',
      'profile_updated',
      'password_changed',
      'password_reset',
      'account_created',
      'view_transactions',
      'view_account'
    ]
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning', 'info'],
    default: 'success'
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Índices para melhorar consultas
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ actionType: 1 });
SecurityLogSchema.index({ createdAt: -1 });
SecurityLogSchema.index({ status: 1 });

const SecurityLog = mongoose.model('SecurityLog', SecurityLogSchema);

module.exports = SecurityLog;
