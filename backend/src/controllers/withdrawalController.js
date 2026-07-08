const crypto = require('crypto');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const walletService = require('../services/walletService');
const incomeService = require('../services/incomeService');
const { sendMail } = require('../services/mailService');
const { dateKey, getCutoffInfo } = require('../utils/payoutCutoff');

const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function notifyUser(userId, title, message) {
  return Notification.create({ user: userId, title, message, category: 'transactional' });
}

const requestWithdrawal = catchAsync(async (req, res) => {
  const { amount, walletAddress } = req.body;
  if (!amount || !walletAddress) throw new ApiError(400, 'Amount and wallet address are required');
  if (amount <= 0) throw new ApiError(400, 'Amount must be positive');

  // Hold the funds immediately so the same balance can't be withdrawn twice.
  await walletService.debit(req.user._id, 'withdrawal', amount, 'withdrawal_request', null);

  const settings = await incomeService.getSettings();
  const { cutoffBucket, payoutCycleDate } = getCutoffInfo(settings.payoutCutoffTime);

  const otpCode = generateOtp();
  const withdrawal = await Withdrawal.create({
    user: req.user._id,
    amount,
    walletAddress,
    otpCode,
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    cutoffBucket,
    payoutCycleDate,
  });

  await sendMail({
    to: req.user.email,
    subject: 'Withdrawal OTP Verification',
    text: `Your OTP to confirm a withdrawal of $${amount} is ${otpCode}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });

  res.status(201).json({ success: true, withdrawalId: withdrawal._id });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { otpCode } = req.body;
  const withdrawal = await Withdrawal.findOne({ _id: req.params.id, user: req.user._id });
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status !== 'pending_otp') throw new ApiError(400, 'Withdrawal already verified');
  if (withdrawal.otpExpiresAt < new Date()) throw new ApiError(400, 'OTP expired, please request again');
  if (withdrawal.otpCode !== otpCode) throw new ApiError(400, 'Invalid OTP');

  withdrawal.otpVerified = true;
  withdrawal.status = 'pending_approval';
  await withdrawal.save();

  if (withdrawal.cutoffBucket === 'after_cutoff') {
    await notifyUser(
      withdrawal.user,
      'Scheduled for Next Payout Cycle',
      `Today's payout window has closed. Your withdrawal of $${withdrawal.amount.toFixed(2)} will be processed in the next payout cycle (${withdrawal.payoutCycleDate}).`
    );
  } else {
    await notifyUser(
      withdrawal.user,
      'Withdrawal Request Submitted',
      `Your withdrawal request of $${withdrawal.amount.toFixed(2)} has been submitted and is pending admin approval.`
    );
  }

  res.json({ success: true, withdrawal });
});

const myWithdrawals = catchAsync(async (req, res) => {
  const withdrawals = await Withdrawal.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, withdrawals });
});

const listWithdrawals = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.cutoffBucket) filter.cutoffBucket = req.query.cutoffBucket;
  const withdrawals = await Withdrawal.find(filter).populate('user', 'name email').sort('-createdAt');
  res.json({ success: true, withdrawals });
});

// Server-time-only cutoff status, used by the customer dashboard/withdraw page for the
// cut-off display and countdown. Client clocks are never trusted for the actual decision -
// this endpoint is the sole source of truth and requestWithdrawal independently re-derives
// the same classification from the server clock at submission time.
const getCutoffStatus = catchAsync(async (req, res) => {
  const settings = await incomeService.getSettings();
  const now = new Date();
  const info = getCutoffInfo(settings.payoutCutoffTime, now);
  res.json({
    success: true,
    cutoffTime: settings.payoutCutoffTime,
    serverNow: now.toISOString(),
    cutoffAt: info.cutoffAt.toISOString(),
    isBeforeCutoff: info.isBeforeCutoff,
    payoutCycleDate: info.payoutCycleDate,
  });
});

const approveWithdrawal = catchAsync(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status !== 'pending_approval') throw new ApiError(400, 'Withdrawal not awaiting approval');
  if (withdrawal.payoutCycleDate > dateKey(new Date())) {
    throw new ApiError(
      400,
      `This withdrawal is scheduled for the next payout cycle (${withdrawal.payoutCycleDate}) and cannot be approved until then.`
    );
  }

  withdrawal.status = 'approved';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  await notifyUser(
    withdrawal.user,
    'Withdrawal Approved',
    `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and will be processed shortly.`
  );

  res.json({ success: true, withdrawal });
});

const startProcessing = catchAsync(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status !== 'approved') throw new ApiError(400, 'Withdrawal must be approved first');

  withdrawal.status = 'processing';
  await withdrawal.save();

  res.json({ success: true, withdrawal });
});

const markPaid = catchAsync(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status !== 'processing') throw new ApiError(400, 'Withdrawal must be in processing first');

  withdrawal.status = 'paid';
  withdrawal.txHash = req.body.txHash || '';
  await withdrawal.save();

  await notifyUser(
    withdrawal.user,
    'Withdrawal Completed',
    `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been paid out.${withdrawal.txHash ? ` Tx: ${withdrawal.txHash}` : ''}`
  );

  res.json({ success: true, withdrawal });
});

const rejectWithdrawal = catchAsync(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (!['pending_approval', 'pending_otp'].includes(withdrawal.status)) {
    throw new ApiError(400, 'Withdrawal cannot be rejected at this stage');
  }

  withdrawal.status = 'rejected';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  withdrawal.rejectionReason = req.body.reason || '';
  await withdrawal.save();

  await walletService.credit(
    withdrawal.user,
    'withdrawal',
    withdrawal.amount,
    'withdrawal_rejected',
    withdrawal._id,
    'Refund for rejected withdrawal'
  );

  await notifyUser(
    withdrawal.user,
    'Withdrawal Rejected',
    `Your withdrawal of $${withdrawal.amount.toFixed(2)} was rejected${withdrawal.rejectionReason ? `: ${withdrawal.rejectionReason}` : '.'} The amount has been refunded to your wallet.`
  );

  res.json({ success: true, withdrawal });
});

module.exports = {
  requestWithdrawal,
  verifyOtp,
  myWithdrawals,
  listWithdrawals,
  getCutoffStatus,
  approveWithdrawal,
  startProcessing,
  markPaid,
  rejectWithdrawal,
};
