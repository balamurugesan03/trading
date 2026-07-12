const mongoose = require('mongoose');
const { Schema } = mongoose;

// Singleton document holding all admin-configurable business rules.
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    referralBonusPercentage: { type: Number, default: 5 },
    // Level income cascades down the unlimited-depth upline chain: level 1 earns this % of
    // the downline's daily ROI, level 2 earns this % of level 1's amount, and so on (e.g. at
    // the 50 default: L1=50% of ROI, L2=25%, L3=12.5%, ...). See incomeService.js.
    levelIncomeCascadePercentage: { type: Number, default: 50 },
    // Total level income any single upline leader can earn from one downline's investment,
    // as a % of that investment's amount - independent of how many days/levels it takes.
    levelIncomeCapPercentage: { type: Number, default: 15 },
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
