
// Diagnostic + fix tool for "admin login works locally but not live" issues.
// Prints which DB/host the script actually connected to (so you can confirm it matches
// the live app's MONGO_URI), lists any users matching the given email, and optionally
// resets their password to a known value.
//
// Usage (run on the LIVE server, in backend/, so it picks up the live .env):
//   node src/scripts/checkAndResetAdmin.js admin@example.com
//   node src/scripts/checkAndResetAdmin.js admin@example.com "NewPassword123!"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email) {
    console.log('Usage: node src/scripts/checkAndResetAdmin.js <email> [newPassword]');
    process.exit(1);
  }

  await connectDB();
  console.log(`Connected DB name: ${mongoose.connection.name}`);
  console.log(`Total users in this DB: ${await User.countDocuments()}`);

  const matches = await User.find({ email: email.toLowerCase() });
  console.log(`Users matching "${email.toLowerCase()}": ${matches.length}`);
  matches.forEach((u, i) => {
    console.log(
      `  [${i}] id=${u._id} role=${u.role} status=${u.status} createdAt=${u.createdAt?.toISOString()}`
    );
  });

  if (newPassword) {
    if (matches.length === 0) {
      console.log('No matching user to reset. Aborting.');
    } else {
      const hashed = await bcrypt.hash(newPassword, 10);
      for (const u of matches) {
        // eslint-disable-next-line no-await-in-loop
        u.password = hashed;
        // eslint-disable-next-line no-await-in-loop
        await u.save();
      }
      console.log(`Password reset to the given value for ${matches.length} user(s).`);
    }
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
