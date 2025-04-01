const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    unique: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['USD', 'EUR'],
    required: [true, 'Account type is required']
  },
  externalAccountId: {
    type: String,
    required: [true, 'External account ID is required'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'active'
  },
  dailyTransferLimit: {
    type: Number,
    default: 10000
  },
  monthlyTransferLimit: {
    type: Number,
    default: 50000
  },
  dailyTransferTotal: {
    type: Number,
    default: 0
  },
  monthlyTransferTotal: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for transactions related to this account
accountSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'account'
});

// Virtual for reservations related to this account
accountSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'account'
});

// Method to check if a transfer amount is within the daily limit
accountSchema.methods.checkDailyLimit = function(amount) {
  return this.dailyTransferTotal + amount <= this.dailyTransferLimit;
};

// Method to check if a transfer amount is within the monthly limit
accountSchema.methods.checkMonthlyLimit = function(amount) {
  return this.monthlyTransferTotal + amount <= this.monthlyTransferLimit;
};

// Method to update transfer totals after a successful transfer
accountSchema.methods.updateTransferTotals = async function(amount) {
  this.dailyTransferTotal += amount;
  this.monthlyTransferTotal += amount;
  return this.save();
};

// Static method to find account by external account ID
accountSchema.statics.findByExternalId = function(externalId) {
  return this.findOne({ externalAccountId: externalId });
};

// Static method to reset daily transfer totals (to be used in a scheduled job)
accountSchema.statics.resetDailyTransferTotals = function() {
  return this.updateMany({}, { $set: { dailyTransferTotal: 0 } });
};

// Static method to reset monthly transfer totals (to be used in a scheduled job)
accountSchema.statics.resetMonthlyTransferTotals = function() {
  return this.updateMany({}, { $set: { monthlyTransferTotal: 0 } });
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
