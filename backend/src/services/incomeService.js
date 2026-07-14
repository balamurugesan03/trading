const User = require('../models/User');
const Setting = require('../models/Setting');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const Investment = require('../models/Investment');
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

// Below this, a level's share is economically meaningless (fractions of a cent).
const MIN_PAYABLE_AMOUNT = 0.01;

// Total investment volume across a user's ENTIRE downline (any depth, via uplineChain),
// excluding one specific investment - used below to work out how much of that investment's
// amount still counts once the Level 2+ qualification threshold is netted out.
async function getDownlineBusinessExcluding(uplineId, excludeInvestmentId) {
  const downline = await User.find({ uplineChain: uplineId }).select('_id');
  const downlineIds = downline.map((d) => d._id);
  if (downlineIds.length === 0) return 0;

  const result = await Investment.aggregate([
    { $match: { user: { $in: downlineIds }, _id: { $ne: excludeInvestmentId } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
}

// Distributes level income up to 5 levels of the upline chain from a downline's daily ROI
// credit. Each level earns a flat % of the ROI itself (levelIncomePercentages[level-1] - not
// cascaded from the level above), and each level's total earnings from this one investment are
// capped at a flat % of the investment (levelIncomeCaps[level-1]). The cap/payout ratio is the
// same across levels by default (0.3), so every level reaches its own cap in the same number of
// days despite earning different daily amounts - see LevelSettingsPage.jsx. Once a leader hits
// their level's cap, their payouts from this investment stop (partial payment on the day that
// crosses the cap); other levels are unaffected since each level's cap is tracked independently.
//
// Level 1 (the direct sponsor) always earns on the full ROI - there is no qualification
// criteria for the direct sponsor, only for Level 2 and above. For Level 2+, the upline's
// entire downline business (any depth) is netted against levelIncomeQualificationBusiness:
// the first chunk of team business up to that threshold doesn't count, only the excess does.
// Concretely - if this investment is the thing that pushes the upline's downline business
// past the threshold, only the portion of THIS investment's amount above the threshold earns
// that level income (scaled 1:1 into the ROI base); once the threshold has already been
// cleared by prior business, the full investment counts from then on.
async function distributeLevelIncome(investment, roiAmount) {
  const settings = await getSettings();
  if (!settings.levelDistributionEnabled) return;

  const user = await User.findById(investment.user);
  const levelCount = Math.min(user.uplineChain.length, settings.levelIncomePercentages.length);

  for (let i = 0; i < levelCount; i += 1) {
    const level = i + 1;
    const uplineId = user.uplineChain[i];

    let eligibleRoiAmount = roiAmount;

    if (level >= 2) {
      // eslint-disable-next-line no-await-in-loop
      const priorBusiness = await getDownlineBusinessExcluding(uplineId, investment._id);
      const newTotal = priorBusiness + investment.amount;
      const eligibleInvestmentAmount = Math.min(
        investment.amount,
        Math.max(0, newTotal - settings.levelIncomeQualificationBusiness)
      );
      if (eligibleInvestmentAmount <= 0) continue; // eslint-disable-line no-continue
      eligibleRoiAmount = (roiAmount * eligibleInvestmentAmount) / investment.amount;
    }

    const payoutPercentage = settings.levelIncomePercentages[i];
    const tierAmount = (eligibleRoiAmount * payoutPercentage) / 100;
    if (tierAmount < MIN_PAYABLE_AMOUNT) continue; // eslint-disable-line no-continue

    const capAmount = (investment.amount * settings.levelIncomeCaps[i]) / 100;

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
      percentage: payoutPercentage,
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
