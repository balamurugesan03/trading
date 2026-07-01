const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: {
      type: String,
      enum: ['deposit', 'roi', 'referral', 'level', 'incentive', 'withdrawal'],
      required: true,
    },
    type: { type: String, enum: ['credit', 'debit', 'transfer'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    source: {
      type: String,
      enum: [
        'deposit_approved',
        'roi_payout',
        'referral_bonus',
        'level_income',
        'monthly_incentive',
        'withdrawal_request',
        'withdrawal_rejected',
        'incentive_transfer',
        'wallet_transfer',
        'admin_adjustment',
      ],
      required: true,
    },
    reference: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
