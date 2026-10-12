const bcrypt = require('bcryptjs');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const walletService = require('../services/walletService');
const { getOrCreateWallet } = walletService;
const { normalizeWithdrawalAddress } = require('../utils/withdrawalAddress');

const TRANSFERABLE_SOURCES = ['roi', 'referral', 'level', 'incentive'];

const myWallet = catchAsync(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);
  res.json({
    success: true,
    wallet,
    withdrawalAddress: req.user.withdrawalAddress || '',
    withdrawalAddressUpdatedAt: req.user.withdrawalAddressUpdatedAt,
  });
});

// Saves or changes the customer's withdrawal address. Changing an existing address needs the
// account password, since it redirects every future (including automatic) payout. An admin
// impersonating the customer can change it without the password.
const updateWithdrawalAddress = catchAsync(async (req, res) => {
  const address = normalizeWithdrawalAddress(req.body.withdrawalAddress);
  const user = req.user;
  const isChange = Boolean(user.withdrawalAddress);

  if (isChange && !req.impersonatedBy) {
    if (!req.body.password) throw new ApiError(400, 'Enter your password to change the withdrawal address');
    if (!(await bcrypt.compare(req.body.password, user.password))) throw new ApiError(400, 'Incorrect password');
  }

  user.withdrawalAddress = address;
  user.withdrawalAddressUpdatedAt = new Date();
  await user.save();

  await Notification.create({
    user: user._id,
    title: isChange ? 'Withdrawal Address Changed' : 'Withdrawal Address Saved',
    message: `Your withdrawals will now be sent to ${address}. If you did not make this change, contact support immediately.`,
    category: 'transactional',
  });

  res.json({
    success: true,
    withdrawalAddress: user.withdrawalAddress,
    withdrawalAddressUpdatedAt: user.withdrawalAddressUpdatedAt,
  });
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
  const wallets = await Wallet.find().populate('user', 'name email status withdrawalAddress').sort('-updatedAt');
  res.json({ success: true, wallets });
});

const myTransactions = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.wallet) filter.wallet = req.query.wallet;
  const transactions = await Transaction.find(filter).sort('-createdAt').limit(200);
  res.json({ success: true, transactions });
});

module.exports = { myWallet, updateWithdrawalAddress, myTransactions, listWallets, transferToWithdrawal };
