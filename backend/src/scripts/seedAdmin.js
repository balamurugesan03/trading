// One-time bootstrap: creates the root super admin, who also acts as the
// top-of-chain sponsor since registration always requires an active sponsor code.
// Run with: node src/scripts/seedAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Setting = require('../models/Setting');
const generateReferralCode = require('../utils/generateReferralCode');

async function run() {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const hashed = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name: 'Super Admin',
    mobile: '0000000000',
    email,
    password: hashed,
    role: 'super_admin',
    referralCode: generateReferralCode(),
    status: 'active',
    activatedAt: new Date(),
    kycStatus: 'approved',
  });

  await Wallet.create({ user: admin._id });
  await Setting.findOneAndUpdate({ key: 'global' }, {}, { upsert: true });

  console.log(`Super admin created: ${email} / ${password}`);
  console.log(`Root referral code: ${admin.referralCode}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
