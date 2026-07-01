const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const catchAsync = require('../utils/catchAsync');
const { getOrCreateWallet } = require('../services/walletService');

async function sumField(Model, match, field = '$amount') {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field } } }]);
  return result[0]?.total || 0;
}

const summary = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [wallet, investments, referralTotal, levelTotal, incentiveTotal, directCount, depositCount, withdrawalCount] =
    await Promise.all([
      getOrCreateWallet(userId),
      Investment.find({ user: userId }).populate('package', 'name'),
      sumField(ReferralIncome, { user: userId }),
      sumField(LevelIncome, { user: userId }),
      sumField(MonthlyIncentive, { user: userId }, '$rewardAmount'),
      User.countDocuments({ sponsor: userId }),
      Deposit.countDocuments({ user: userId }),
      Withdrawal.countDocuments({ user: userId }),
    ]);

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalRoiEarned = investments.reduce((sum, i) => sum + i.totalReturned, 0);

  res.json({
    success: true,
    summary: {
      referralCode: req.user.referralCode,
      referralLink: `${process.env.CLIENT_URL}/register?ref=${req.user.referralCode}`,
      kycStatus: req.user.kycStatus,
      accountStatus: req.user.status,
      totalInvested,
      activePackages: activeInvestments.length,
      totalRoiEarned,
      referralIncome: referralTotal,
      levelIncome: levelTotal,
      monthlyIncentiveIncome: incentiveTotal,
      directReferralCount: directCount,
      depositCount,
      withdrawalCount,
      wallet,
      investments,
    },
  });
});

const team = catchAsync(async (req, res) => {
  const directs = await User.find({ sponsor: req.user._id }).select(
    'name email status activatedAt createdAt referralCode'
  );

  const directsWithBusiness = await Promise.all(
    directs.map(async (d) => {
      const total = await sumField(Investment, { user: d._id });
      return { ...d.toObject(), totalInvested: total };
    })
  );

  res.json({ success: true, directReferrals: directsWithBusiness });
});

module.exports = { summary, team };
