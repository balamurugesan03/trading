const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

const BALANCE_FIELD = {
  deposit: 'depositBalance',
  roi: 'roiBalance',
  referral: 'referralBalance',
  level: 'levelBalance',
  incentive: 'incentiveBalance',
  withdrawal: 'withdrawalBalance',
};

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId });
  return wallet;
}

async function credit(userId, walletType, amount, source, reference, description = '') {
  const field = BALANCE_FIELD[walletType];
  const wallet = await getOrCreateWallet(userId);
  wallet[field] += amount;
  await wallet.save();

  await Transaction.create({
    user: userId,
    wallet: walletType,
    type: 'credit',
    amount,
    balanceAfter: wallet[field],
    source,
    reference,
    description,
  });

  return wallet;
}

async function debit(userId, walletType, amount, source, reference, description = '') {
  const field = BALANCE_FIELD[walletType];
  const wallet = await getOrCreateWallet(userId);
  if (wallet[field] < amount) {
    throw new ApiError(400, `Insufficient ${walletType} balance`);
  }
  wallet[field] -= amount;
  await wallet.save();

  await Transaction.create({
    user: userId,
    wallet: walletType,
    type: 'debit',
    amount,
    balanceAfter: wallet[field],
    source,
    reference,
    description,
  });

  return wallet;
}

module.exports = { getOrCreateWallet, credit, debit, BALANCE_FIELD };
