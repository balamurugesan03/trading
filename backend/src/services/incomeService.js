const User = require('../models/User');
const Investment = require('../models/Investment');
const Setting = require('../models/Setting');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const walletService = require('./walletService');

async function getSettings() {
  let settings = await Setting.findOne({ key: 'global' });
  if (!settings) settings = await Setting.create({ key: 'global' });
  return settings;
}

// 5% instant bonus to the direct sponsor when a deposit is approved.
async function payReferralBonus(investment) {
  const settings = await getSettings();
  const user = await User.findById(investment.user);
  if (!user.sponsor) return;

  const amount = (investment.amount * settings.referralBonusPercentage) / 100;

  await ReferralIncome.create({
    user: user.sponsor,
    fromUser: user._id,
    investment: investment._id,
    investmentAmount: investment.amount,
    percentage: settings.referralBonusPercentage,
    amount,
  });

  await walletService.credit(
    user.sponsor,
    'referral',
    amount,
    'referral_bonus',
    investment._id,
    `5% referral bonus from ${user.name}'s deposit`
  );
}

// Sum of all approved investment amounts a user has personally referred (their direct downlines).
async function getDirectBusiness(userId) {
  const directs = await User.find({ sponsor: userId }).select('_id');
  const directIds = directs.map((d) => d._id);
  if (directIds.length === 0) return 0;
  const result = await Investment.aggregate([
    { $match: { user: { $in: directIds } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
}

// Distributes level income up to 5 levels from a downline's ROI credit.
// Level 1 always qualifies via the direct sponsor; each deeper level only unlocks
// once the level-1 sponsor of that branch has generated the qualification business.
async function distributeLevelIncome(investment, roiAmount) {
  const settings = await getSettings();
  const user = await User.findById(investment.user);
  const uplineIds = user.uplineChain.slice(0, 5);

  for (let i = 0; i < uplineIds.length; i += 1) {
    const level = i + 1;
    const uplineId = uplineIds[i];

    if (level > 1) {
      const directSponsorId = uplineIds[0];
      const directBusiness = await getDirectBusiness(directSponsorId);
      if (directBusiness < settings.levelQualificationBusiness) break;
    }

    const percentage = settings.levelPercentages[i];
    if (!percentage) continue;
    const amount = (roiAmount * percentage) / 100;

    await LevelIncome.create({
      user: uplineId,
      fromUser: user._id,
      investment: investment._id,
      level,
      roiAmount,
      percentage,
      amount,
    });

    await walletService.credit(
      uplineId,
      'level',
      amount,
      'level_income',
      investment._id,
      `Level ${level} income from ${user.name}'s ROI`
    );
  }
}

module.exports = { getSettings, payReferralBonus, getDirectBusiness, distributeLevelIncome };
