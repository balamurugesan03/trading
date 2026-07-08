// One person may register several accounts under the same email (and/or mobile number),
// e.g. one per family member or investment. Capped to stop unbounded signup abuse.
const MAX_ACCOUNTS_PER_EMAIL = 10;

module.exports = { MAX_ACCOUNTS_PER_EMAIL };
