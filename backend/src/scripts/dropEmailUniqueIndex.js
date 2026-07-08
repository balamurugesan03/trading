
// One-time migration: removes the old unique index on User.email so multiple accounts
// (up to MAX_ACCOUNTS_PER_EMAIL) can share the same email address, matching the app code.
// Safe to run more than once - does nothing if the index is already gone.
// Run with: node src/scripts/dropEmailUniqueIndex.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function run() {
  await connectDB();

  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  const emailIndex = indexes.find((idx) => idx.name === 'email_1');

  if (!emailIndex) {
    console.log('No email_1 index found - nothing to do.');
  } else if (!emailIndex.unique) {
    console.log('email_1 index exists but is already non-unique - nothing to do.');
  } else {
    await collection.dropIndex('email_1');
    console.log('Dropped unique index email_1 on users collection.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
