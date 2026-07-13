const mongoose = require('mongoose');
const { Schema } = mongoose;

const withdrawalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    captchaAnswer: { type: Number, required: true },
    captchaExpiresAt: { type: Date, required: true },
    captchaVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending_verification', 'pending_approval', 'approved', 'processing', 'rejected', 'paid'],
      default: 'pending_verification',
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    txHash: { type: String, default: '' },
    // Which side of the day's payout cut-off this request fell on when submitted, and which
    // day's payout cycle it's assigned to as a result. Both are fixed at request time using
    // the server clock only (see utils/payoutCutoff.js) and never change afterwards.
    cutoffBucket: { type: String, enum: ['before_cutoff', 'after_cutoff'], required: true },
    payoutCycleDate: { type: String, required: true }, // "YYYY-MM-DD", server local time
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
