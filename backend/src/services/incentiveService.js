const User = require('../models/User');
const Investment = require('../models/Investment');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const Wallet = require('../models/Wallet');
const walletService = require('./walletService');
const { getSettings } = require('./incomeService');

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // YYYY-MM
}

function monthRange(key) {
  const [year, month] = key.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

// For a given month, credits every qualifying user's monthly incentive
// (direct business >= threshold -> percentage reward), then sweeps the
// entire incentive wallet into the withdrawal wallet and resets it.
async function runMonthlyIncentiveCycle(key = monthKey(new Date(Date.now() - 24 * 60 * 60 * 1000))) {
  const settings = await getSettings();
  if (!settings.incentiveDistributionEnabled) {
    console.warn('Monthly incentive distribution is disabled in settings - skipping cycle');
    return { creditedCount: 0, transferredWallets: 0, skipped: true };
  }

  const { start, end } = monthRange(key);
  const users = await User.find({ status: 'active' });

  let creditedCount = 0;

  for (const user of users) {
    const directs = await User.find({ sponsor: user._id }).select('_id');
    const directIds = directs.map((d) => d._id);
    if (directIds.length === 0) continue; // eslint-disable-line no-continue

    const result = await Investment.aggregate([
      { $match: { user: { $in: directIds }, activatedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const directBusiness = result[0]?.total || 0;
    if (directBusiness < settings.monthlyIncentiveMinBusiness) continue; // eslint-disable-line no-continue

    const exists = await MonthlyIncentive.findOne({ user: user._id, month: key });
    if (exists) continue; // eslint-disable-line no-continue

    const rewardAmount = (directBusiness * settings.monthlyIncentivePercentage) / 100;

    await MonthlyIncentive.create({
      user: user._id,
      month: key,
      directBusiness,
      percentage: settings.monthlyIncentivePercentage,
      rewardAmount,
    });

    await walletService.credit(
      user._id,
      'incentive',
      rewardAmount,
      'monthly_incentive',
      user._id,
      `Monthly incentive for ${key} (${settings.monthlyIncentivePercentage}% of $${directBusiness})`
    );

    creditedCount += 1;
  }

  // Month-end sweep: move whatever sits in each incentive wallet to the withdrawal wallet.
  const wallets = await Wallet.find({ incentiveBalance: { $gt: 0 } });
  for (const wallet of wallets) {
    const amount = wallet.incentiveBalance;
    await walletService.debit(wallet.user, 'incentive', amount, 'incentive_transfer', wallet._id);
    await walletService.credit(wallet.user, 'withdrawal', amount, 'incentive_transfer', wallet._id);
  }

  await MonthlyIncentive.updateMany({ month: key }, { status: 'transferred' });

  return { creditedCount, transferredWallets: wallets.length };
}

module.exports = { runMonthlyIncentiveCycle, monthKey, monthRange };
