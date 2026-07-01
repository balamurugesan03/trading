const express = require('express');
const { listIncentives } = require('../controllers/incentiveController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictTo('super_admin'), listIncentives);

module.exports = router;
