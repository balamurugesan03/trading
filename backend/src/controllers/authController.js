const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const generateReferralCode = require('../utils/generateReferralCode');
const { MAX_ACCOUNTS_PER_EMAIL } = require('../constants/accountLimits');

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

  const normalizedEmail = email.toLowerCase();
  const existingCount = await User.countDocuments({ email: normalizedEmail });
  if (existingCount >= MAX_ACCOUNTS_PER_EMAIL) {
    throw new ApiError(400, `Maximum ${MAX_ACCOUNTS_PER_EMAIL} accounts are allowed per email address`);
  }

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
    email: normalizedEmail,
    password: hashed,
    referralCode,
    sponsor: sponsor._id,
    // Full ancestor chain, unlimited depth - level income cascades all the way up (see
    // incomeService.js distributeLevelIncome), so this must not be truncated.
    uplineChain: [sponsor._id, ...sponsor.uplineChain],
    status: 'pending_activation',
  });

  await Wallet.create({ user: user._id });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: sanitize(user) });
});

// Login accepts either the account's email or its Customer ID (referralCode, shown to the
// customer on their dashboard). Customer ID is unique per account, so it's a direct lookup.
// Email can be shared across up to MAX_ACCOUNTS_PER_EMAIL accounts (see
// constants/accountLimits.js), so that path disambiguates by checking the password against
// each candidate until one matches.
const login = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, 'Email/Customer ID and password are required');

  const value = identifier.trim();
  let matched = null;

  if (value.includes('@')) {
    const candidates = await User.find({ email: value.toLowerCase() });
    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(password, candidate.password)) {
        matched = candidate;
        break;
      }
    }
  } else {
    const user = await User.findOne({ referralCode: value.toUpperCase() });
    if (user && (await bcrypt.compare(password, user.password))) matched = user;
  }

  if (!matched) throw new ApiError(401, 'Invalid email/Customer ID or password');
  if (matched.status === 'suspended') throw new ApiError(403, 'Account suspended');

  const token = signToken(matched);
  res.json({ success: true, token, user: sanitize(matched) });
});

const me = catchAsync(async (req, res) => {
  await req.user.populate('sponsor', 'name email referralCode');
  res.json({ success: true, user: sanitize(req.user) });
});

const AVATAR_ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Uploads/replaces the logged-in customer's own profile picture. Reuses the shared upload
// middleware (which also allows .pdf for KYC/deposit proofs), so this rejects anything that
// isn't actually an image rather than trusting the shared filter alone.
const updateAvatar = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  if (!AVATAR_ALLOWED_EXTENSIONS.includes(path.extname(req.file.filename).toLowerCase())) {
    throw new ApiError(400, 'Avatar must be a png or jpg image');
  }

  req.user.avatarUrl = `/uploads/${req.file.filename}`;
  await req.user.save();

  res.json({ success: true, user: sanitize(req.user) });
});

// Public lookup so the registration form can show "Sponsor: <name>" as the customer types
// their sponsor's referral code, letting them confirm they're joining under the right person
// before submitting. Only the name (and whether the account can currently sponsor) is
// exposed - never email/mobile/etc - since this is callable without being logged in.
const getSponsorByCode = catchAsync(async (req, res) => {
  const sponsor = await User.findOne({ referralCode: req.params.code });
  if (!sponsor) throw new ApiError(404, 'No account found with that sponsor/referral code');
  res.json({ success: true, sponsor: { name: sponsor.name, active: sponsor.status === 'active' } });
});

module.exports = { register, login, me, updateAvatar, getSponsorByCode };
