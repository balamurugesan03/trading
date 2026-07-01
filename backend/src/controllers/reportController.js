const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const catchAsync = require('../utils/catchAsync');

async function sumField(Model, match, field = '$amount') {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field } } }]);
  return result[0]?.total || 0;
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
  ]);

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
    },
  });
});

module.exports = { overview };
