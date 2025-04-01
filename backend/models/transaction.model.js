const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'reservation', 'confirmation', 'receive'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR'],
    required: [true, 'Currency is required']
  },
  sourceAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  destinationAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  externalSourceAccount: {
    type: String
  },
  externalDestinationAccount: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
    default: 'pending'
  },
  reference: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  externalReference: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ sourceAccount: 1, createdAt: -1 });
transactionSchema.index({ destinationAccount: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ externalReference: 1 });

// Method to mark transaction as completed
transactionSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.completedAt = Date.now();
  return this.save();
};

// Method to mark transaction as failed
transactionSchema.methods.markFailed = async function(reason) {
  this.status = 'failed';
  this.metadata.failureReason = reason;
  return this.save();
};

// Static method to get transactions for an account
transactionSchema.statics.getAccountTransactions = function(accountId, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sourceAccount: accountId },
      { destinationAccount: accountId }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sourceAccount', 'accountNumber accountType')
    .populate('destinationAccount', 'accountNumber accountType')
    .populate('createdBy', 'name email');
};

// Static method to find transaction by external reference
transactionSchema.statics.findByExternalReference = function(externalRef) {
  return this.findOne({ externalReference: externalRef });
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
