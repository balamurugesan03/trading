const express = require('express');
const { summary, team } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, summary);
router.get('/team', protect, team);

module.exports = router;
