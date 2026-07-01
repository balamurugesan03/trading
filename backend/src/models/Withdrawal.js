const mongoose = require('mongoose');
const { Schema } = mongoose;

const withdrawalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    otpCode: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending_otp', 'pending_approval', 'approved', 'rejected', 'paid'],
      default: 'pending_otp',
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    txHash: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
