const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    depositBalance: { type: Number, default: 0 },
    roiBalance: { type: Number, default: 0 },
    referralBalance: { type: Number, default: 0 },
    levelBalance: { type: Number, default: 0 },
    incentiveBalance: { type: Number, default: 0 },
    withdrawalBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
