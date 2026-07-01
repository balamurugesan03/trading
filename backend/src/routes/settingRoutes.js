const express = require('express');
const {
  getGlobalSettings,
  updateGlobalSettings,
  setTodayRoiRate,
  listRoiRates,
} = require('../controllers/settingController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getGlobalSettings);
router.patch('/', protect, restrictTo('super_admin'), updateGlobalSettings);
router.post('/roi-rate', protect, restrictTo('super_admin'), setTodayRoiRate);
router.get('/roi-rate', protect, restrictTo('super_admin'), listRoiRates);

module.exports = router;
