const cron = require('node-cron');
const { runDailyAutoWithdrawals } = require('../services/autoWithdrawalService');
const { getSettings } = require('../services/incomeService');
const { getCutoffInfo } = require('../utils/payoutCutoff');

// Same cadence as the ROI cron: checks every minute and, once today's payout cut-off has passed,
// sweeps withdrawal-wallet balances to customers' saved addresses. Each run after the first is a
// no-op for customers already swept today (see autoWithdrawalService.js). The in-process flag
// stops a slow run from overlapping the next minute's tick.
function startAutoWithdrawalCron() {
  let running = false;

  cron.schedule('* * * * *', async () => {
    if (running) return;
    running = true;
    try {
      const settings = await getSettings();
      if (!settings.autoWithdrawalEnabled) return;
      const { isBeforeCutoff } = getCutoffInfo(settings.payoutCutoffTime);
      if (isBeforeCutoff) return;

      const { created } = await runDailyAutoWithdrawals();
      if (created > 0) console.log(`Auto-withdrawal cron: created ${created} withdrawals`);
    } catch (err) {
      console.error('Auto-withdrawal cron failed', err);
    } finally {
      running = false;
    }
  });
}

module.exports = startAutoWithdrawalCron;
