const express = require('express');
const {
  requestWithdrawal,
  verifyOtp,
  myWithdrawals,
  listWithdrawals,
  approveWithdrawal,
  markPaid,
  rejectWithdrawal,
} = require('../controllers/withdrawalController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requestWithdrawal);
router.post('/:id/verify-otp', protect, verifyOtp);
router.get('/my', protect, myWithdrawals);
router.get('/', protect, restrictTo('super_admin'), listWithdrawals);
router.patch('/:id/approve', protect, restrictTo('super_admin'), approveWithdrawal);
router.patch('/:id/pay', protect, restrictTo('super_admin'), markPaid);
router.patch('/:id/reject', protect, restrictTo('super_admin'), rejectWithdrawal);

module.exports = router;
