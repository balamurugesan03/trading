const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const generateReferralCode = require('../utils/generateReferralCode');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

const register = catchAsync(async (req, res) => {
  const { name, mobile, email, password, sponsorCode } = req.body;

  if (!name || !mobile || !email || !password || !sponsorCode) {
    throw new ApiError(400, 'Name, mobile, email, password and sponsor code are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(400, 'Email already registered');

  const sponsor = await User.findOne({ referralCode: sponsorCode });
  if (!sponsor) throw new ApiError(400, 'Invalid sponsor/referral code');
  if (sponsor.status !== 'active') {
    throw new ApiError(400, 'Sponsor account is not activated and cannot refer new users');
  }

  const hashed = await bcrypt.hash(password, 10);
  let referralCode = generateReferralCode();
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ referralCode })) referralCode = generateReferralCode();

  const user = await User.create({
    name,
    mobile,
    email: email.toLowerCase(),
    password: hashed,
    referralCode,
    sponsor: sponsor._id,
    uplineChain: [sponsor._id, ...sponsor.uplineChain].slice(0, 5),
    status: 'pending_activation',
  });

  await Wallet.create({ user: user._id });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: sanitize(user) });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status === 'suspended') throw new ApiError(403, 'Account suspended');

  const token = signToken(user);
  res.json({ success: true, token, user: sanitize(user) });
});

const me = catchAsync(async (req, res) => {
  await req.user.populate('sponsor', 'name email referralCode');
  res.json({ success: true, user: sanitize(req.user) });
});

module.exports = { register, login, me };
