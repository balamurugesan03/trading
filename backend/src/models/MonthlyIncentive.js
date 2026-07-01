const mongoose = require('mongoose');
const { Schema } = mongoose;

const monthlyIncentiveSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // YYYY-MM
    directBusiness: { type: Number, required: true },
    percentage: { type: Number, required: true },
    rewardAmount: { type: Number, required: true },
    status: { type: String, enum: ['credited', 'transferred'], default: 'credited' },
  },
  { timestamps: true }
);

monthlyIncentiveSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyIncentive', monthlyIncentiveSchema);
