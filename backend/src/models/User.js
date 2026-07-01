const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    activatedAt: { type: Date, default: null },

    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
