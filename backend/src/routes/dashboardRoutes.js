const express = require('express');
const {
  summary,
  team,
  referralHistory,
  levelIncomeHistory,
  incentiveHistory,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, summary);
router.get('/team', protect, team);
router.get('/referral-history', protect, referralHistory);
router.get('/level-income-history', protect, levelIncomeHistory);
router.get('/incentive-history', protect, incentiveHistory);

module.exports = router;
