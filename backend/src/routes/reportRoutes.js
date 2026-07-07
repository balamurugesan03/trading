const express = require('express');
const {
  overview,
  listInvestments,
  listReferralIncome,
  listLevelIncome,
  listTodayTransactions,
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, restrictTo('super_admin'), overview);
router.get('/investments', protect, restrictTo('super_admin'), listInvestments);
router.get('/referral-income', protect, restrictTo('super_admin'), listReferralIncome);
router.get('/level-income', protect, restrictTo('super_admin'), listLevelIncome);
router.get('/today-transactions', protect, restrictTo('super_admin'), listTodayTransactions);

module.exports = router;
