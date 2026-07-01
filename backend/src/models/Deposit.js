const mongoose = require('mongoose');
const { Schema } = mongoose;

const depositSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    amount: { type: Number, required: true },
    companyWalletAddress: { type: String, required: true },
    screenshotUrl: { type: String, required: true },
    txReference: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deposit', depositSchema);
