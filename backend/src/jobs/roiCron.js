const cron = require('node-cron');
const { runDailyRoi } = require('../services/roiService');

// Runs every day at 00:05 server time.
function startRoiCron() {
  cron.schedule('5 0 * * *', async () => {
    try {
      const { credited } = await runDailyRoi();
      console.log(`ROI cron: credited ${credited} investments`);
    } catch (err) {
      console.error('ROI cron failed', err);
    }
  });
}

module.exports = startRoiCron;
