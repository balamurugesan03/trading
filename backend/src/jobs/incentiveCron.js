const cron = require('node-cron');
const { runMonthlyIncentiveCycle } = require('../services/incentiveService');

// Runs at 00:30 on the 1st of every month, processing the month that just ended.
function startIncentiveCron() {
  cron.schedule('30 0 1 * *', async () => {
    try {
      const result = await runMonthlyIncentiveCycle();
      console.log('Monthly incentive cron result:', result);
    } catch (err) {
      console.error('Monthly incentive cron failed', err);
    }
  });
}

module.exports = startIncentiveCron;
