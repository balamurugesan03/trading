const Deposit = require('../models/Deposit');
const Investment = require('../models/Investment');
const Package = require('../models/Package');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const incomeService = require('../services/incomeService');

const createDeposit = catchAsync(async (req, res) => {
  const { packageId, amount, txReference } = req.body;
  if (!packageId || !amount || !txReference || !req.file) {
    throw new ApiError(400, 'Package, amount, transaction reference and screenshot are required');
  }

  const pkg = await Package.findById(packageId);
  if (!pkg || !pkg.active) throw new ApiError(400, 'Invalid package');
  if (amount < pkg.minAmount || amount > pkg.maxAmount) {
    throw new ApiError(400, `Amount must be between ${pkg.minAmount} and ${pkg.maxAmount}`);
  }

  const settings = await incomeService.getSettings();

  const deposit = await Deposit.create({
    user: req.user._id,
    package: pkg._id,
    amount,
    companyWalletAddress: settings.companyWalletAddress,
    screenshotUrl: `/uploads/${req.file.filename}`,
    txReference,
  });

  res.status(201).json({ success: true, deposit });
});

const myDeposits = catchAsync(async (req, res) => {
  const deposits = await Deposit.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, deposits });
});

const listDeposits = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const deposits = await Deposit.find(filter).populate('user', 'name email').sort('-createdAt');
  res.json({ success: true, deposits });
});

const approveDeposit = catchAsync(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  if (deposit.status !== 'pending') throw new ApiError(400, 'Deposit already processed');

  const settings = await incomeService.getSettings();
  const now = new Date();
  const roiStartAt = new Date(now.getTime() + settings.roiStartDelayHours * 60 * 60 * 1000);

  deposit.status = 'approved';
  deposit.reviewedBy = req.user._id;
  deposit.reviewedAt = now;
  await deposit.save();

  const investment = await Investment.create({
    user: deposit.user,
    package: deposit.package,
    deposit: deposit._id,
    amount: deposit.amount,
    capAmount: deposit.amount * settings.investmentCapMultiplier,
    activatedAt: now,
    roiStartAt,
  });

  const user = await User.findById(deposit.user);
  if (user.status === 'pending_activation') {
    user.status = 'active';
    user.activatedAt = now;
    await user.save();
  }

  await incomeService.payReferralBonus(investment);

  res.json({ success: true, deposit, investment });
});

const rejectDeposit = catchAsync(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);
  if (!deposit) throw new ApiError(404, 'Deposit not found');
  if (deposit.status !== 'pending') throw new ApiError(400, 'Deposit already processed');

  deposit.status = 'rejected';
  deposit.reviewedBy = req.user._id;
  deposit.reviewedAt = new Date();
  deposit.rejectionReason = req.body.reason || '';
  await deposit.save();

  res.json({ success: true, deposit });
});

module.exports = { createDeposit, myDeposits, listDeposits, approveDeposit, rejectDeposit };
