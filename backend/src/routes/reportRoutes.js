const express = require('express');
const { overview } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, restrictTo('super_admin'), overview);

module.exports = router;
