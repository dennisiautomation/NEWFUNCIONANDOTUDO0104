const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationCode: {
    type: String,
    required: [true, 'Reservation code is required'],
    unique: true,
    trim: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required']
  },
  externalAccountId: {
    type: String,
    required: [true, 'External account ID is required'],
    trim: true
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'expired'],
    default: 'pending'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  sourceInfo: {
    name: String,
    accountNumber: String,
    bankName: String,
    country: String
  },
  destinationInfo: {
    name: String,
    accountNumber: String,
    bankName: String,
    country: String
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  confirmedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
reservationSchema.index({ reservationCode: 1 });
reservationSchema.index({ account: 1 });
reservationSchema.index({ externalAccountId: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });

// Pre-save hook to set expiration date if not provided
reservationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Default expiration: 7 days from creation
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to confirm reservation
reservationSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = Date.now();
  return this.save();
};

// Method to cancel reservation
reservationSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.cancelledAt = Date.now();
  return this.save();
};

// Method to check if reservation is expired
reservationSchema.methods.isExpired = function() {
  return this.expiresAt < Date.now();
};

// Static method to find reservation by code
reservationSchema.statics.findByCode = function(code) {
  return this.findOne({ reservationCode: code });
};

// Static method to mark expired reservations
reservationSchema.statics.markExpired = function() {
  return this.updateMany(
    { 
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

// Static method to get pending reservations for an account
reservationSchema.statics.getPendingForAccount = function(accountId) {
  return this.find({
    account: accountId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).sort({ expiresAt: 1 });
};

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
