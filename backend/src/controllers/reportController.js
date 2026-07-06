const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');

async function sumField(Model, match, field = '$amount') {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field } } }]);
  return result[0]?.total || 0;
}

// Sum of today's (UTC calendar day) wallet credits for a given payout source -
// this is what the company needs to know they must fund/transfer out today.
async function sumCreditedToday(source) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
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

module.exports = { overview };
