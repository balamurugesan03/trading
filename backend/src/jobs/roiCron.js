const cron = require('node-cron');
const { runDailyRoi } = require('../services/roiService');
const { getSettings } = require('../services/incomeService');
const { getCutoffInfo } = require('../utils/payoutCutoff');

// Checks every minute (IST-anchored - see utils/payoutCutoff.js) whether today's admin-configured
// payout cut-off time has passed yet, and only then runs the daily ROI distribution - so ROI lands
// right after cut-off instead of at a fixed hour. Safe to fire more than once after cut-off each
// day: runDailyRoi's own per-investment same-day check (see roiService.js) makes every run after
// the first a no-op for anything already credited today.
function startRoiCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await getSettings();
      const { isBeforeCutoff } = getCutoffInfo(settings.payoutCutoffTime);
      if (isBeforeCutoff) return;

      const { credited } = await runDailyRoi();
      if (credited > 0) console.log(`ROI cron: credited ${credited} investments`);
    } catch (err) {
      console.error('ROI cron failed', err);
    }
  });
}

module.exports = startRoiCron;
