const express = require('express');
const {
  createDeposit,
  myDeposits,
  listDeposits,
  approveDeposit,
  rejectDeposit,
} = require('../controllers/depositController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, upload.single('screenshot'), createDeposit);
router.get('/my', protect, myDeposits);
router.get('/', protect, restrictTo('super_admin'), listDeposits);
router.patch('/:id/approve', protect, restrictTo('super_admin'), approveDeposit);
router.patch('/:id/reject', protect, restrictTo('super_admin'), rejectDeposit);

module.exports = router;
