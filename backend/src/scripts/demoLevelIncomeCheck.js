// Throwaway verification script: builds a 6-user sponsor chain (5 uplines + 1 depositor),
// simulates one day of ROI on a demo investment, and checks the resulting LevelIncome
// records/wallet credits against what incomeService.distributeLevelIncome *should* produce
// given the live admin settings. All demo data is deleted again in the finally block.
// Run with: node src/scripts/demoLevelIncomeCheck.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const LevelIncome = require('../models/LevelIncome');
const Transaction = require('../models/Transaction');
const generateReferralCode = require('../utils/generateReferralCode');
const incomeService = require('../services/incomeService');

const TAG = 'DEMO_LEVEL_TEST';
const INVESTMENT_AMOUNT = 10000;
const ROI_PERCENTAGE = 1; // 1% for this simulated day

async function run() {
  await connectDB();

  const createdUserIds = [];
  const createdInvestmentIds = [];
  const users = {};
  const levels = ['L5', 'L4', 'L3', 'L2', 'L1', 'Depositor']; // L5 = topmost sponsor

  try {
    const settings = await incomeService.getSettings();
    console.log('Live settings in use:');
    console.log('  levelIncomePercentages:', settings.levelIncomePercentages);
    console.log('  levelIncomeCaps:', settings.levelIncomeCaps);
    console.log('  levelDistributionEnabled:', settings.levelDistributionEnabled);

    let chain = [];
    let sponsorId = null;
    for (const label of levels) {
      const user = await User.create({
        name: `${TAG}_${label}`,
        mobile: '9999999999',
        email: `${TAG.toLowerCase()}_${label.toLowerCase()}@example.com`,
        password: 'not-used',
        referralCode: generateReferralCode(),
        sponsor: sponsorId,
        uplineChain: chain,
        status: 'active',
      });
      await Wallet.create({ user: user._id });
      users[label] = user;
      createdUserIds.push(user._id);
      chain = [user._id, ...chain];
      sponsorId = user._id;
    }

    const depositor = users.Depositor;
    console.log(`\nChain built: Depositor -> ${['L1', 'L2', 'L3', 'L4', 'L5'].join(' -> ')}`);
    console.log(`Depositor.uplineChain length: ${depositor.uplineChain.length}`);

    const investment = await Investment.create({
      user: depositor._id,
      package: new mongoose.Types.ObjectId(),
      deposit: new mongoose.Types.ObjectId(),
      amount: INVESTMENT_AMOUNT,
      capAmount: INVESTMENT_AMOUNT * settings.investmentCapMultiplier,
      activatedAt: new Date(),
      roiStartAt: new Date(Date.now() - 1000),
    });
    createdInvestmentIds.push(investment._id);

    const roiAmount = (INVESTMENT_AMOUNT * ROI_PERCENTAGE) / 100;
    console.log(
      `\nSimulating one day of ROI: investment=₹${INVESTMENT_AMOUNT}, rate=${ROI_PERCENTAGE}% => roiAmount=₹${roiAmount}`
    );

    await incomeService.distributeLevelIncome(investment, roiAmount);

    console.log('\nLevel | Leader | Expected amount | Actual LevelIncome | Actual wallet.levelBalance | Result');
    let allPass = true;
    const levelLabels = ['L1', 'L2', 'L3', 'L4', 'L5'];
    for (let i = 0; i < levelLabels.length; i += 1) {
      const label = levelLabels[i];
      const leader = users[label];
      const pct = settings.levelIncomePercentages[i];
      const capPct = settings.levelIncomeCaps[i];
      const expectedTier = (roiAmount * pct) / 100;
      const capAmount = (INVESTMENT_AMOUNT * capPct) / 100;
      const expectedAmount = Math.min(expectedTier, capAmount);

      // eslint-disable-next-line no-await-in-loop
      const li = await LevelIncome.findOne({ user: leader._id, investment: investment._id });
      // eslint-disable-next-line no-await-in-loop
      const wallet = await Wallet.findOne({ user: leader._id });

      const actualAmount = li ? li.amount : 0;
      const actualBalance = wallet.levelBalance;
      const pass = Math.abs(actualAmount - expectedAmount) < 0.0001 && Math.abs(actualBalance - expectedAmount) < 0.0001;
      if (!pass) allPass = false;

      console.log(
        `${label}    | ${leader.name.padEnd(20)} | ₹${expectedAmount.toFixed(2).padEnd(10)} | ₹${actualAmount
          .toFixed(2)
          .padEnd(10)} | ₹${actualBalance.toFixed(2).padEnd(10)} | ${pass ? 'PASS' : 'FAIL'}`
      );
    }

    console.log(`\nOverall: ${allPass ? 'ALL LEVELS CORRECT' : 'MISMATCH FOUND'}`);
  } finally {
    await LevelIncome.deleteMany({ investment: { $in: createdInvestmentIds } });
    await Transaction.deleteMany({ user: { $in: createdUserIds } });
    await Investment.deleteMany({ _id: { $in: createdInvestmentIds } });
    await Wallet.deleteMany({ user: { $in: createdUserIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    console.log('\nDemo data cleaned up (no trace left in DB).');
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
