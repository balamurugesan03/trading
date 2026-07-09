
// One-time fix-up: for investments already sitting inside their 24h ROI-start wait,
// pull roiStartAt back to now so they're eligible on the very next ROI cron run,
// instead of waiting out the delay they were created with. Only touches active
// investments still in the future - already-eligible or closed investments are untouched.
// Safe to run more than once - matches nothing once every active investment's roiStartAt
// is already <= now.
// Run with: node src/scripts/makeActiveInvestmentsRoiInstant.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Investment = require('../models/Investment');

async function run() {
  await connectDB();

  const now = new Date();
  const result = await Investment.updateMany(
    { status: 'active', roiStartAt: { $gt: now } },
    { $set: { roiStartAt: now } }
  );

  console.log(`Updated ${result.modifiedCount} active investment(s) to be ROI-eligible now.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
