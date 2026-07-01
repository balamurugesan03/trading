const mongoose = require('mongoose');
const { Schema } = mongoose;

const referralIncomeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // earner (sponsor)
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // referred user
    investment: { type: Schema.Types.ObjectId, ref: 'Investment', required: true },
    investmentAmount: { type: Number, required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralIncome', referralIncomeSchema);
