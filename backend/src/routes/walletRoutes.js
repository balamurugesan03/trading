const express = require('express');
const {
  myWallet,
  updateWithdrawalAddress,
  myTransactions,
  listWallets,
  transferToWithdrawal,
} = require('../controllers/walletController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, myWallet);
router.put('/my/withdrawal-address', protect, updateWithdrawalAddress);
router.get('/my/transactions', protect, myTransactions);
router.post('/my/transfer', protect, transferToWithdrawal);
router.get('/', protect, restrictTo('super_admin'), listWallets);

module.exports = router;
