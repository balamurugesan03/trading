const mongoose = require('mongoose');
const { Schema } = mongoose;

const investmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    deposit: { type: Schema.Types.ObjectId, ref: 'Deposit', required: true },
    amount: { type: Number, required: true },
    capAmount: { type: Number, required: true }, // 2x amount
    totalReturned: { type: Number, default: 0 },
    activatedAt: { type: Date, required: true },
    roiStartAt: { type: Date, required: true }, // activatedAt + 24h
    lastRoiCreditedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Investment', investmentSchema);
