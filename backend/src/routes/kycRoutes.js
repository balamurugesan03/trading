const express = require('express');
const { submitKyc, myKyc, listKyc, reviewKyc } = require('../controllers/kycController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
  ]),
  submitKyc
);
router.get('/my', protect, myKyc);
router.get('/', protect, restrictTo('super_admin'), listKyc);
router.patch('/:id/review', protect, restrictTo('super_admin'), reviewKyc);

module.exports = router;
