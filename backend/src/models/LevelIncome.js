const mongoose = require('mongoose');
const { Schema } = mongoose;

const levelIncomeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // earner (upline)
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // downline whose ROI generated this
    investment: { type: Schema.Types.ObjectId, ref: 'Investment', required: true },
    level: { type: Number, required: true, min: 1 }, // unlimited depth - see incomeService.js
    roiAmount: { type: Number, required: true }, // the downline's ROI that this is based on
    percentage: { type: Number, required: true }, // this level's effective % of roiAmount (cascaded)
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LevelIncome', levelIncomeSchema);
