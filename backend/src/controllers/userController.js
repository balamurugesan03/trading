const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

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

const suspendUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true }).select(
    '-password'
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

const activateUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.status = 'active';
  if (!user.activatedAt) user.activatedAt = new Date();
  await user.save();
  res.json({ success: true, user });
});

module.exports = { listUsers, getUser, suspendUser, activateUser };
