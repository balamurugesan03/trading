const mongoose = require('mongoose');
const { Schema } = mongoose;

const kycSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    aadhaarNumber: { type: String, default: '' },
    aadhaarUrl: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    panUrl: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remarks: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kyc', kycSchema);
