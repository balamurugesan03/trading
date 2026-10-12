const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const walletService = require('./walletService');
const { getSettings } = require('./incomeService');
const { getCutoffInfo } = require('../utils/payoutCutoff');

const MIN_AUTO_AMOUNT = 0.01;

// Daily sweep: for every customer with a saved withdrawal address and a positive withdrawal-wallet
// balance, debit the full balance and create a withdrawal to that address for today's payout cycle.
// These skip the customer captcha and land in 'pending_approval', so they flow through the same
// admin approve -> processing -> mark paid steps (the on-chain USDT transfer itself is still done
// by the admin). Idempotent per customer per day via the unique { user, payoutCycleDate } index
// on auto withdrawals, so running it every minute after cut-off is safe.
async function runDailyAutoWithdrawals(now = new Date()) {
  const settings = await getSettings();
  if (!settings.autoWithdrawalEnabled) return { created: 0 };

  const { todayKey } = getCutoffInfo(settings.payoutCutoffTime, now);

  const alreadyDone = await Withdrawal.find({ source: 'auto', payoutCycleDate: todayKey }).distinct('user');
  const users = await User.find({
    role: 'customer',
    status: 'active',
    withdrawalAddress: { $nin: ['', null] },
    _id: { $nin: alreadyDone },
  }).select('_id withdrawalAddress');
  if (users.length === 0) return { created: 0 };

  const wallets = await Wallet.find({
    user: { $in: users.map((u) => u._id) },
    withdrawalBalance: { $gte: MIN_AUTO_AMOUNT },
  }).select('user withdrawalBalance');
  const addressByUser = new Map(users.map((u) => [String(u._id), u.withdrawalAddress]));

  let created = 0;
  for (const wallet of wallets) {
    const userId = wallet.user;
    const walletAddress = addressByUser.get(String(userId));
    const amount = Math.floor(wallet.withdrawalBalance * 100) / 100;
    if (amount < MIN_AUTO_AMOUNT) continue;

    try {
      // Claim the day's slot first - if another run already created it, the unique index
      // rejects this before any money moves.
      const etaMinutes = crypto.randomInt(5, 61);
      const withdrawal = await Withdrawal.create({
        user: userId,
        amount,
        walletAddress,
        source: 'auto',
        captchaAnswer: 0,
        captchaExpiresAt: now,
        captchaVerified: true,
        status: 'pending_approval',
        cutoffBucket: 'before_cutoff',
        payoutCycleDate: todayKey,
        creditEtaAt: new Date(now.getTime() + etaMinutes * 60 * 1000),
      });

      try {
        await walletService.debit(userId, 'withdrawal', amount, 'withdrawal_request', withdrawal._id, 'Daily auto-withdrawal');
      } catch (err) {
        // Balance changed since we read it (e.g. a manual withdrawal just went in) - drop the claim.
        await Withdrawal.deleteOne({ _id: withdrawal._id });
        continue;
      }

      await Notification.create({
        user: userId,
        title: 'Daily Withdrawal Scheduled',
        message: `Your withdrawal wallet balance of $${amount.toFixed(2)} is being sent to your saved address ${walletAddress}.`,
        category: 'transactional',
      });
      created += 1;
    } catch (err) {
      if (err.code === 11000) continue; // already created for today by an overlapping run
      console.error(`Auto-withdrawal failed for user ${userId}`, err);
    }
  }

  return { created };
}

module.exports = { runDailyAutoWithdrawals };
