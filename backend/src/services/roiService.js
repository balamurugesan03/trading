const Investment = require('../models/Investment');
const RoiRate = require('../models/RoiRate');
const walletService = require('./walletService');
const incomeService = require('./incomeService');

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isSameDay(a, b) {
  return todayKey(new Date(a)) === todayKey(new Date(b));
}

// Runs once per day (see jobs/roiCron.js). Credits ROI to every active investment
// that has passed its 24h start delay and hasn't already been credited today,
// then caps/closes the investment once totalReturned reaches capAmount.
async function runDailyRoi() {
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

    let roiAmount = (investment.amount * rate.percentage) / 100;
    const remainingToCap = investment.capAmount - investment.totalReturned;
    if (roiAmount >= remainingToCap) {
      roiAmount = remainingToCap;
    }
    if (roiAmount <= 0) continue; // eslint-disable-line no-continue

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
    credited += 1;
  }

  return { credited };
}

module.exports = { runDailyRoi, todayKey };
