const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const RoiRate = require('../models/RoiRate');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const { getOrCreateWallet } = require('../services/walletService');
const { todayKey } = require('../services/roiService');

// The % actually applied on the user's most recently credited ROI payout, not today's
// admin-configured rate (which may not match what was credited if it wasn't set yet when the
// cron ran, or if the investor's ROI already stopped for the day/closed) - see DashboardPage.jsx
// Energy Bar.
async function getLastCreditedRoiRate(userId) {
  const lastRoiTx = await Transaction.findOne({ user: userId, source: 'roi_payout' }).sort('-createdAt');
  if (!lastRoiTx) return null;

  const rate = await RoiRate.findOne({ date: todayKey(lastRoiTx.createdAt) });
  return rate?.percentage ?? null;
}

async function sumField(Model, match, field = '$amount') {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field } } }]);
  return result[0]?.total || 0;
}

const summary = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [
    wallet,
    investments,
    referralTotal,
    levelTotal,
    incentiveTotal,
    directCount,
    depositCount,
    withdrawalCount,
    ,
    lastCreditedRoiRate,
    totalWithdrawn,
  ] = await Promise.all([
    getOrCreateWallet(userId),
    Investment.find({ user: userId }).populate('package', 'name'),
    sumField(ReferralIncome, { user: userId }),
    sumField(LevelIncome, { user: userId }),
    sumField(MonthlyIncentive, { user: userId }, '$rewardAmount'),
    User.countDocuments({ sponsor: userId }),
    Deposit.countDocuments({ user: userId }),
    Withdrawal.countDocuments({ user: userId }),
    req.user.populate('sponsor', 'name'),
    getLastCreditedRoiRate(userId),
    // Total amount actually paid out, not the pending/in-flight withdrawal balance (that's
    // already shown in the wallet) - see DashboardPage.jsx "Total Withdrawal" stat card.
    sumField(Withdrawal, { user: userId, status: 'paid' }),
  ]);

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalRoiEarned = investments.reduce((sum, i) => sum + i.totalReturned, 0);
  // Energy bar: how much of the total ROI cap (each investment's admin-configured
  // capAmount, not necessarily a fixed 2x) has been earned so far across all investments.
  const totalCapAmount = investments.reduce((sum, i) => sum + i.capAmount, 0);
  const energyProgress = totalCapAmount > 0 ? Math.min(100, (totalRoiEarned / totalCapAmount) * 100) : 0;

  res.json({
    success: true,
    summary: {
      name: req.user.name,
      avatarUrl: req.user.avatarUrl,
      referralCode: req.user.referralCode,
      referralLink: `${process.env.CLIENT_URL}/register?ref=${req.user.referralCode}`,
      invitedBy: req.user.sponsor?.name || null,
      kycStatus: req.user.kycStatus,
      accountStatus: req.user.status,
      totalInvested,
      activePackages: activeInvestments.length,
      totalRoiEarned,
      energyProgress,
      todayRoiRate: lastCreditedRoiRate,
      referralIncome: referralTotal,
      levelIncome: levelTotal,
      monthlyIncentiveIncome: incentiveTotal,
      directReferralCount: directCount,
      depositCount,
      withdrawalCount,
      totalWithdrawn,
      wallet,
      investments,
    },
  });
});

// Whole downline, unlimited depth (uplineChain is the full ancestor chain - see authController).
// A member's level relative to the requesting user is their position of req.user's id in that
// member's own uplineChain, so the same query naturally reconstructs the referral tree.
const team = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const downline = await User.find({ uplineChain: userId }).select(
    'name email status activatedAt createdAt referralCode sponsor uplineChain'
  );

  const sponsorIds = [...new Set(downline.map((d) => String(d.sponsor)))];
  const sponsors = await User.find({ _id: { $in: sponsorIds } }).select('name email');
  const sponsorMap = new Map(sponsors.map((s) => [String(s._id), s]));

  const members = await Promise.all(
    downline.map(async (d) => {
      const totalInvested = await sumField(Investment, { user: d._id });
      const level = d.uplineChain.findIndex((id) => String(id) === String(userId)) + 1;
      const sponsor = sponsorMap.get(String(d.sponsor));
      return {
        _id: d._id,
        name: d.name,
        email: d.email,
        status: d.status,
        createdAt: d.createdAt,
        activatedAt: d.activatedAt,
        referralCode: d.referralCode,
        level,
        sponsorName: sponsor?.name || null,
        totalInvested,
      };
    })
  );

  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  members.forEach((m) => {
    if (levelCounts[m.level] !== undefined) levelCounts[m.level] += 1;
  });

  members.sort((a, b) => a.level - b.level || new Date(a.createdAt) - new Date(b.createdAt));

  res.json({
    success: true,
    totalTeamMembers: members.length,
    levelCounts,
    members,
  });
});

const referralHistory = catchAsync(async (req, res) => {
  const records = await ReferralIncome.find({ user: req.user._id })
    .populate('fromUser', 'name email')
    .sort('-createdAt');
  res.json({ success: true, records });
});

const levelIncomeHistory = catchAsync(async (req, res) => {
  const records = await LevelIncome.find({ user: req.user._id })
    .populate('fromUser', 'name email')
    .sort('-createdAt');
  res.json({ success: true, records });
});

const incentiveHistory = catchAsync(async (req, res) => {
  const records = await MonthlyIncentive.find({ user: req.user._id }).sort('-month');
  res.json({ success: true, records });
});

module.exports = { summary, team, referralHistory, levelIncomeHistory, incentiveHistory };
