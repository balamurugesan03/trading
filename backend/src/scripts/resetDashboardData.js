// Zeroes out the admin dashboard's financial cards (see controllers/reportController.js
// overview) by deleting ALL Investment/Deposit/Withdrawal/ReferralIncome/LevelIncome/
// MonthlyIncentive/Transaction records. Users are left untouched, so totalUsers/
// activeUsers/pendingActivation still reflect real user counts - every other card
// (totalInvested, active/closedInvestments, totalRoiPaid, pendingDeposits/Withdrawals,
// totalReferralPaid, totalLevelPaid, totalIncentivePaid, the 3 "Today" cards and
// totalCompanyPayoutToday) will read 0.
// DESTRUCTIVE - this permanently deletes financial history. Double-check you are
// pointed at the right database (check MONGO_URI / .env) before running.
// Run with: node src/scripts/resetDashboardData.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MonthlyIncentive = require('../models/MonthlyIncentive');
const Transaction = require('../models/Transaction');

const MODELS = [
  ['Investment', Investment],
  ['Deposit', Deposit],
  ['Withdrawal', Withdrawal],
  ['ReferralIncome', ReferralIncome],
  ['LevelIncome', LevelIncome],
  ['MonthlyIncentive', MonthlyIncentive],
  ['Transaction', Transaction],
];

async function run() {
  await connectDB();

  for (const [name, Model] of MODELS) {
    const { deletedCount } = await Model.deleteMany({});
    console.log(`${name}: deleted ${deletedCount} record(s)`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
