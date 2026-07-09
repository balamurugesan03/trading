const mongoose = require('mongoose');
const { Schema } = mongoose;

// Singleton document holding all admin-configurable business rules.
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    referralBonusPercentage: { type: Number, default: 5 },
    levelPercentages: {
      type: [Number],
      default: [50, 40, 30, 20, 10], // level 1..5
    },
    levelQualificationBusiness: { type: Number, default: 2000 },
    investmentCapMultiplier: { type: Number, default: 2 },
    roiStartDelayHours: { type: Number, default: 24 },
    monthlyIncentiveMinBusiness: { type: Number, default: 1000 },
    monthlyIncentivePercentage: { type: Number, default: 2 },
    companyWalletAddress: { type: String, default: '' },
    // 24h "HH:mm" in IST (see utils/payoutCutoff.js). Withdrawals requested after this time
    // each day are queued for the next day's payout cycle instead of today's, and it's also
    // when the daily ROI cron fires (see jobs/roiCron.js).
    payoutCutoffTime: { type: String, default: '03:00' },
    roiDistributionEnabled: { type: Boolean, default: true },
    levelDistributionEnabled: { type: Boolean, default: true },
    incentiveDistributionEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
