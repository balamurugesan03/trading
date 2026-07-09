const Investment = require('../models/Investment');
const RoiRate = require('../models/RoiRate');
const walletService = require('./walletService');
const incomeService = require('./incomeService');
const { dateKey } = require('../utils/payoutCutoff');

// Anchored to IST (see utils/payoutCutoff.js) rather than host-local/UTC, so "today" for
// ROI rate lookup and same-day crediting matches what the admin means by "today" regardless
// of the server's OS timezone - this was the same class of bug fixed for the payout cutoff.
function todayKey(date = new Date()) {
  return dateKey(date);
}

function isSameDay(a, b) {
  return todayKey(new Date(a)) === todayKey(new Date(b));
}

// Credits one day's ROI to a single investment at the given rate: wallet credit, cap/close
// handling, and the resulting level income - shared by the daily cron and the instant
// on-approval credit so both paths behave identically. Returns the credited amount, or null
// if there was nothing left to credit (already at cap). Callers are responsible for the
// same-day dedupe check (isSameDay against lastRoiCreditedAt) before calling this.
async function creditRoi(investment, rate, now = new Date()) {
  let roiAmount = (investment.amount * rate.percentage) / 100;
  const remainingToCap = investment.capAmount - investment.totalReturned;
  if (roiAmount >= remainingToCap) {
    roiAmount = remainingToCap;
  }
  if (roiAmount <= 0) return null;

  await walletService.credit(
    investment.user,
    'roi',
    roiAmount,
    'roi_payout',
    investment._id,
    `Daily ROI (${rate.percentage}%) for investment ${investment._id}`
  );

  investment.totalReturned += roiAmount;
  investment.lastRoiCreditedAt = now;
  if (investment.totalReturned >= investment.capAmount) {
    investment.status = 'closed';
    investment.closedAt = now;
  }
  await investment.save();

  await incomeService.distributeLevelIncome(investment, roiAmount);
  return roiAmount;
}

// Runs once per day, after the admin-configured cut-off time (see jobs/roiCron.js). Credits
// ROI to every active investment that has passed its start delay and hasn't already been
// credited today, then caps/closes the investment once totalReturned reaches capAmount.
async function runDailyRoi() {
  const settings = await incomeService.getSettings();
  if (!settings.roiDistributionEnabled) {
    console.warn('ROI distribution is disabled in settings - skipping ROI run');
    return { credited: 0, skipped: true };
  }

  const now = new Date();
  const rate = await RoiRate.findOne({ date: todayKey(now) });
  if (!rate) {
    console.warn(`No ROI rate set for ${todayKey(now)} - skipping ROI run`);
    return { credited: 0 };
  }

  const investments = await Investment.find({
    status: 'active',
    roiStartAt: { $lte: now },
  });

  let credited = 0;

  for (const investment of investments) {
    if (investment.lastRoiCreditedAt && isSameDay(investment.lastRoiCreditedAt, now)) {
      continue; // eslint-disable-line no-continue
    }

    const roiAmount = await creditRoi(investment, rate, now);
    if (roiAmount !== null) credited += 1;
  }

  return { credited };
}

// Credits the first ROI payout immediately when a deposit is approved, instead of waiting
// for the next daily cron tick. Only fires if ROI distribution is on and an admin has already
// set today's rate - otherwise it's a no-op and the investment just picks up ROI on a future
// cron run like normal, same as before this existed. Sets lastRoiCreditedAt on success, so the
// same-day cron run (and any later same-day approval) naturally skips it via the isSameDay
// check in runDailyRoi - no separate dedupe bookkeeping needed.
async function creditInstantRoiOnApproval(investment) {
  const settings = await incomeService.getSettings();
  if (!settings.roiDistributionEnabled) return null;

  const now = new Date();
  const rate = await RoiRate.findOne({ date: todayKey(now) });
  if (!rate) return null;

  return creditRoi(investment, rate, now);
}

module.exports = { runDailyRoi, todayKey, creditInstantRoiOnApproval };
