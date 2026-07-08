const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    // Not unique - the same email (or mobile) can register up to MAX_ACCOUNTS_PER_EMAIL
    // accounts (see constants/accountLimits.js). Login disambiguates by password match.
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'customer', 'team_leader'], default: 'customer' },

    referralCode: { type: String, required: true, unique: true },
    sponsor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    uplineChain: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    status: {
      type: String,
      enum: ['pending_activation', 'active', 'suspended'],
      default: 'pending_activation',
    },
    // Status the account had before being blocked, so unblocking restores it instead of
    // always forcing 'active' (which would wrongly skip pending_activation).
    previousStatus: { type: String, enum: ['pending_activation', 'active'], default: null },
    activatedAt: { type: Date, default: null },

    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
