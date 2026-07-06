// Fixed deposit package tiers. Customers can only pick one of these amounts;
// the server derives the amount from the selection instead of trusting client input.
const DEPOSIT_PACKAGE_AMOUNTS = [100, 200, 500, 1000, 5000, 10000];

module.exports = { DEPOSIT_PACKAGE_AMOUNTS };
