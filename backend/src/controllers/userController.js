const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { MAX_ACCOUNTS_PER_EMAIL } = require('../constants/accountLimits');

const IMPERSONATION_TTL = '1h';

const listUsers = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
      { referralCode: new RegExp(req.query.search, 'i') },
    ];
  }
  const users = await User.find(filter).select('-password').sort('-createdAt');
  res.json({ success: true, users });
});

const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('sponsor', 'name email referralCode');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// "Block" - remembers the prior status so unblocking can restore it exactly.
const suspendUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.status !== 'suspended') {
    user.previousStatus = user.status;
    user.status = 'suspended';
    await user.save();
  }
  const sanitized = user.toObject();
  delete sanitized.password;
  res.json({ success: true, user: sanitized });
});

// "Unblock" - restores whatever status the account had before it was blocked
// (pending_activation stays pending, active stays active) instead of always forcing active.
const activateUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.status = user.status === 'suspended' ? user.previousStatus || 'active' : 'active';
  user.previousStatus = null;
  if (user.status === 'active' && !user.activatedAt) user.activatedAt = new Date();
  await user.save();
  const sanitized = user.toObject();
  delete sanitized.password;
  res.json({ success: true, user: sanitized });
});

const updateUser = catchAsync(async (req, res) => {
  const { name, email, mobile } = req.body;
  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (mobile !== undefined) update.mobile = mobile.trim();

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingCount = await User.countDocuments({ email: normalizedEmail, _id: { $ne: req.params.id } });
    if (existingCount >= MAX_ACCOUNTS_PER_EMAIL) {
      throw new ApiError(400, `Maximum ${MAX_ACCOUNTS_PER_EMAIL} accounts are allowed per email address`);
    }
    update.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select(
    '-password'
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// Permanently removes a user. Deposit/investment/withdrawal history is allowed to be deleted
// along with the account (admin's call) - their Deposit/Investment/Withdrawal/Transaction/
// ReferralIncome/LevelIncome records are left in place (orphaned, for whatever audit trail is
// still needed) rather than cascade-deleted. The one thing this still won't skip: any of the
// user's investments still 'active' get force-closed first. Leaving one active would mean the
// ROI cron's next tick calls User.findById(this now-deleted id) inside distributeLevelIncome
// and crashes on a null user - which halts ROI crediting for every other customer's investment
// in that same run, not just this one (see roiService.js/incomeService.js), every minute,
// indefinitely. Downline members are still a hard block - deleting a sponsor out from under
// active downline would leave their sponsor/uplineChain pointing at a ghost ID.
const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'super_admin') throw new ApiError(400, 'Cannot delete an admin account');

  const downlineCount = await User.countDocuments({ sponsor: user._id });
  if (downlineCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete: ${downlineCount} account(s) were referred by this user. Suspend the account instead.`
    );
  }

  await Investment.updateMany(
    { user: user._id, status: 'active' },
    { $set: { status: 'closed', closedAt: new Date() } }
  );

  await Wallet.deleteOne({ user: user._id });
  await user.deleteOne();

  res.json({ success: true });
});

// Lets a super admin open a customer's dashboard without their password, for support/
// verification. Issues a short-lived, clearly-marked token instead of the customer's own
// 7-day session token, and records who issued it so protect() can allow viewing even a
// suspended account (that's often exactly the account an admin needs to inspect) while
// every other suspended-account restriction still applies to the customer's own logins.
const impersonateUser = catchAsync(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'super_admin') {
    throw new ApiError(400, 'Cannot log in as another admin account');
  }

  const token = jwt.sign(
    { id: target._id, role: target.role, impersonatedBy: req.user._id },
    process.env.JWT_SECRET,
    { expiresIn: IMPERSONATION_TTL }
  );

  console.log(`[impersonation] admin ${req.user.email} (${req.user._id}) logged in as ${target.email} (${target._id})`);

  const sanitized = target.toObject();
  delete sanitized.password;
  res.json({ success: true, token, user: sanitized });
});

module.exports = {
  listUsers,
  getUser,
  suspendUser,
  activateUser,
  updateUser,
  resetPassword,
  deleteUser,
  impersonateUser,
};
