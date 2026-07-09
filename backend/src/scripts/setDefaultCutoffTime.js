
// One-time fix-up: the schema default for payoutCutoffTime changed to '03:00' (see
// models/Setting.js), but a schema default only applies to a brand-new document - the
// already-existing 'global' Setting document keeps whatever value it was saved with. This
// pushes 03:00 onto that existing document directly, so it's live without an admin having to
// open Settings and set it by hand.
// Safe to run more than once.
// Run with: node src/scripts/setDefaultCutoffTime.js 
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Setting = require('../models/Setting');

async function run() {
  await connectDB();

  const settings = await Setting.findOneAndUpdate(
    { key: 'global' },
    { $set: { payoutCutoffTime: '03:00' } },
    { upsert: true, new: true }
  );

  console.log(`payoutCutoffTime is now: ${settings.payoutCutoffTime}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
