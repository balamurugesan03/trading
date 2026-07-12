
// One-time backfill for the level-income redesign: uplineChain used to be truncated to 5
// ancestors on registration, but level income now cascades up the full chain with no depth
// limit (see incomeService.js). This walks each existing user's sponsor pointers all the way
// to the root and rewrites uplineChain to the complete, untruncated ancestor list.
// Run with: node src/scripts/rebuildUplineChains.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  await connectDB();

  const users = await User.find().select('_id sponsor uplineChain');
  const sponsorOf = new Map(users.map((u) => [String(u._id), u.sponsor ? String(u.sponsor) : null]));

  const ops = [];
  for (const user of users) {
    const chain = [];
    const visited = new Set([String(user._id)]);
    let currentId = sponsorOf.get(String(user._id));

    while (currentId && !visited.has(currentId)) {
      chain.push(currentId);
      visited.add(currentId);
      currentId = sponsorOf.get(currentId) || null;
    }

    const unchanged =
      chain.length === user.uplineChain.length && chain.every((id, i) => id === String(user.uplineChain[i]));
    if (unchanged) continue; // eslint-disable-line no-continue

    ops.push({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { uplineChain: chain } },
      },
    });
  }

  if (ops.length === 0) {
    console.log('All upline chains already up to date - nothing to do.');
  } else {
    const result = await User.bulkWrite(ops);
    console.log(`Rebuilt upline chains for ${result.modifiedCount} of ${users.length} users.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
