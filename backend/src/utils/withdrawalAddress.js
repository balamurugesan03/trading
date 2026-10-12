const ApiError = require('./ApiError');

// Light sanity check only - USDT can be on several networks (TRC20, BEP20, ERC20...), so this
// rejects obvious typos/pastes (spaces, too short/long) without assuming one address format.
function normalizeWithdrawalAddress(raw) {
  const address = String(raw || '').trim();
  if (!address) throw new ApiError(400, 'Wallet address is required');
  if (/\s/.test(address)) throw new ApiError(400, 'Wallet address must not contain spaces');
  if (address.length < 20 || address.length > 128) throw new ApiError(400, 'Wallet address looks invalid');
  return address;
}

module.exports = { normalizeWithdrawalAddress };
