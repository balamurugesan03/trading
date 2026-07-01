const { v4: uuidv4 } = require('uuid');

module.exports = function generateReferralCode() {
  return uuidv4().split('-')[0].toUpperCase();
};
