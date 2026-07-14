const mongoose = require('mongoose');
const { Schema } = mongoose;

// Singleton document holding all admin-configurable business rules.
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    referralBonusPercentage: { type: Number, default: 5 },
    // Level 1..5 daily payout, each a flat % of the downline's ROI (not cascaded from the
    // level above) - see incomeService.js.
    levelIncomePercentages: { type: [Number], default: [50, 40, 30, 20, 10] },
    // Level 1..5 cap, each a % of the investment's amount. Chosen so the cap/payout ratio is
    // constant across levels (0.3 at the defaults), so every level reaches its own cap in the
    // same number of days despite earning different daily amounts.
    levelIncomeCaps: { type: [Number], default: [15, 12, 9, 6, 3] },
    investmentCapMultiplier: { type: Number, default: 2 },
    roiStartDelayHours: { type: Number, default: 24 },
    monthlyIncentiveMinBusiness: { type: Number, default: 1000 },
    monthlyIncentivePercentage: { type: Number, default: 2 },
    // Level 1 (direct sponsor) always earns level income on the full ROI. For Level 2+, this
    // is netted against the upline's entire downline business (any depth): only the portion of
    // team business above this threshold earns that level's income - see
    // incomeService.distributeLevelIncome.
    levelIncomeQualificationBusiness: { type: Number, default: 2000 },
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
