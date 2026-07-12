const User = require('../models/User');
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

// Total level income a given leader has already earned from one specific downline
// investment, across all previous days - used to enforce the per-leader cap below.
async function getLeaderLevelIncomeSoFar(leaderId, investmentId) {
  const result = await LevelIncome.aggregate([
    { $match: { user: leaderId, investment: investmentId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
}

// Below this, a level's cascaded share is economically meaningless (fractions of a cent) -
// stops the otherwise-unbounded upline walk once amounts decay into noise.
const MIN_PAYABLE_AMOUNT = 0.01;

// Distributes level income up the full (unlimited-depth) upline chain from a downline's daily
// ROI credit. Each level earns levelIncomeCascadePercentage of the level above it's amount
// (level 1 = that % of the ROI itself, level 2 = that % of level 1's amount, and so on), so it
// halves (at the 50% default) at every step rather than using a fixed per-level schedule.
// Each individual leader's total earnings from this one investment are capped at
// levelIncomeCapPercentage of the investment's amount - once a leader hits that cap, their
// payouts from this investment stop (partial payment on the day that crosses the cap), but
// deeper levels are unaffected since their cap is tracked independently.
async function distributeLevelIncome(investment, roiAmount) {
  const settings = await getSettings();
  if (!settings.levelDistributionEnabled) return;

  const user = await User.findById(investment.user);
  const capAmount = (investment.amount * settings.levelIncomeCapPercentage) / 100;

  let tierAmount = roiAmount;

  for (let i = 0; i < user.uplineChain.length; i += 1) {
    const level = i + 1;
    const uplineId = user.uplineChain[i];

    tierAmount = (tierAmount * settings.levelIncomeCascadePercentage) / 100;
    if (tierAmount < MIN_PAYABLE_AMOUNT) break;

    // eslint-disable-next-line no-await-in-loop
    const alreadyPaid = await getLeaderLevelIncomeSoFar(uplineId, investment._id);
    if (alreadyPaid >= capAmount) continue; // eslint-disable-line no-continue

    const amount = Math.min(tierAmount, capAmount - alreadyPaid);
    if (amount < MIN_PAYABLE_AMOUNT) continue; // eslint-disable-line no-continue

    // eslint-disable-next-line no-await-in-loop
    await LevelIncome.create({
      user: uplineId,
      fromUser: user._id,
      investment: investment._id,
      level,
      roiAmount,
      percentage: (tierAmount / roiAmount) * 100,
      amount,
    });

    // eslint-disable-next-line no-await-in-loop
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

module.exports = { getSettings, payReferralBonus, distributeLevelIncome };
