const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const walletService = require('../services/walletService');
const { getOrCreateWallet } = walletService;

const TRANSFERABLE_SOURCES = ['roi', 'referral', 'level', 'incentive'];

const myWallet = catchAsync(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  res.json({ success: true, wallet });
});

// Moves earnings out of an income wallet (ROI/referral/level/incentive) into
// the withdrawal wallet, since only the withdrawal wallet can be cashed out.
const transferToWithdrawal = catchAsync(async (req, res) => {
  const { from, amount } = req.body;
  if (!TRANSFERABLE_SOURCES.includes(from)) throw new ApiError(400, 'Invalid source wallet');
  if (!amount || amount <= 0) throw new ApiError(400, 'Enter a valid amount');

  await walletService.debit(req.user._id, from, amount, 'wallet_transfer', null, `Transfer from ${from} wallet`);
  const wallet = await walletService.credit(
    req.user._id,
    'withdrawal',
    amount,
    'wallet_transfer',
    null,
    `Transfer from ${from} wallet`
  );

  res.json({ success: true, wallet });
});

const listWallets = catchAsync(async (req, res) => {
  const wallets = await Wallet.find().populate('user', 'name email status').sort('-updatedAt');
  res.json({ success: true, wallets });
});

const myTransactions = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.wallet) filter.wallet = req.query.wallet;
  const transactions = await Transaction.find(filter).sort('-createdAt').limit(200);
  res.json({ success: true, transactions });
});

module.exports = { myWallet, myTransactions, listWallets, transferToWithdrawal };
