
// One-time fix-up: before this fix, deleting a user (see controllers/userController.js
// deleteUser) left their Investment/Deposit/Withdrawal/ReferralIncome/LevelIncome/
// MonthlyIncentive/Transaction records behind. Admin dashboard totals sum across all
// documents in those collections, so a since-deleted user's amounts kept counting forever.
// This finds records whose `user` no longer exists and deletes them.
// Safe to run more than once - once orphans are gone, later runs delete nothing.
// Run with: node src/scripts/cleanupOrphanedRecords.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

const MODELS = [
  ['Investment', Investment],
  ['Deposit', Deposit],
  ['Withdrawal', Withdrawal],
  ['ReferralIncome', ReferralIncome],
  ['LevelIncome', LevelIncome],
  ['MonthlyIncentive', MonthlyIncentive],
  ['Transaction', Transaction],
  ['Wallet', Wallet],
];

async function run() {
  await connectDB();

  const existingUserIds = new Set((await User.find().select('_id')).map((u) => String(u._id)));

  for (const [name, Model] of MODELS) {
    const userIds = await Model.distinct('user');
    const orphanedIds = userIds.filter((id) => id && !existingUserIds.has(String(id)));
    if (orphanedIds.length === 0) {
      console.log(`${name}: no orphaned records`);
      continue;
    }
    const { deletedCount } = await Model.deleteMany({ user: { $in: orphanedIds } });
    console.log(`${name}: deleted ${deletedCount} orphaned record(s) from ${orphanedIds.length} deleted user(s)`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
