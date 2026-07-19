const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { businessDayRange } = require('../utils/payoutCutoff');

const TODAY_PAYOUT_SOURCES = ['roi_payout', 'level_income', 'monthly_incentive'];

async function sumField(Model, match, field = '$amount') {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field } } }]);
  return result[0]?.total || 0;
}

// Sum of today's (IST calendar day - see utils/payoutCutoff.js) wallet credits for a given
// payout source - this is what the company needs to know they must fund/transfer out today.
// Anchored to IST so it matches when ROI actually gets credited (after the IST cutoff), not
// the host/UTC calendar day.
async function sumCreditedToday(source) {
  const { start, end } = businessDayRange();
  return sumField(Transaction, { source, type: 'credit', createdAt: { $gte: start, $lt: end } });
}

const overview = catchAsync(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    pendingActivation,
    totalInvested,
    activeInvestments,
    closedInvestments,
    totalRoiPaid,
    pendingDeposits,
    pendingWithdrawals,
    totalReferralPaid,
    totalLevelPaid,
    totalIncentivePaid,
    roiPayoutToday,
    levelIncomeToday,
    monthlyIncentiveToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'pending_activation' }),
    sumField(Investment, {}),
    Investment.countDocuments({ status: 'active' }),
    Investment.countDocuments({ status: 'closed' }),
    sumField(Investment, {}, '$totalReturned'),
    Deposit.countDocuments({ status: 'pending' }),
    Withdrawal.countDocuments({ status: 'pending_approval' }),
    sumField(ReferralIncome, {}),
    sumField(LevelIncome, {}),
    sumField(MonthlyIncentive, {}, '$rewardAmount'),
    sumCreditedToday('roi_payout'),
    sumCreditedToday('level_income'),
    sumCreditedToday('monthly_incentive'),
  ]);

  const totalCompanyPayoutToday = roiPayoutToday + levelIncomeToday + monthlyIncentiveToday;

  res.json({
    success: true,
    report: {
      totalUsers,
      activeUsers,
      pendingActivation,
      totalInvested,
      activeInvestments,
      closedInvestments,
      totalRoiPaid,
      pendingDeposits,
      pendingWithdrawals,
      totalReferralPaid,
      totalLevelPaid,
      totalIncentivePaid,
      roiPayoutToday,
      levelIncomeToday,
      monthlyIncentiveToday,
      totalCompanyPayoutToday,
    },
  });
});

// Admin-wide investments list (drill-down for Total Invested / Active / Closed / Total ROI Paid cards).
const listInvestments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const investments = await Investment.find(filter)
    .populate('user', 'name email')
    .populate('package', 'name')
    .sort('-createdAt')
    .limit(500);
  res.json({ success: true, investments });
});

// Admin-wide referral income list (drill-down for Total Referral Paid).
const listReferralIncome = catchAsync(async (req, res) => {
  const records = await ReferralIncome.find()
    .populate('user', 'name email')
    .populate('fromUser', 'name email')
    .sort('-createdAt')
    .limit(500);
  res.json({ success: true, records });
});

// Admin-wide level income list (drill-down for Total Level Paid).
const listLevelIncome = catchAsync(async (req, res) => {
  const records = await LevelIncome.find()
    .populate('user', 'name email')
    .populate('fromUser', 'name email')
    .sort('-createdAt')
    .limit(500);
  res.json({ success: true, records });
});

// Today's credited payout transactions (drill-down for the 4 "Today" cards).
// ?source=roi_payout|level_income|monthly_incentive narrows to one card; omitted = all three combined.
const listTodayTransactions = catchAsync(async (req, res) => {
  const { start, end } = businessDayRange();
  const filter = { type: 'credit', createdAt: { $gte: start, $lt: end } };
  if (req.query.source) {
    if (!TODAY_PAYOUT_SOURCES.includes(req.query.source)) throw new ApiError(400, 'Invalid source');
    filter.source = req.query.source;
  } else {
    filter.source = { $in: TODAY_PAYOUT_SOURCES };
  }
  const transactions = await Transaction.find(filter).populate('user', 'name email').sort('-createdAt').limit(500);
  res.json({ success: true, transactions });
});

module.exports = { overview, listInvestments, listReferralIncome, listLevelIncome, listTodayTransactions };
