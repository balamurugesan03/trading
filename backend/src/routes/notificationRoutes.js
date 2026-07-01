const express = require('express');
const {
  myNotifications,
  markRead,
  createNotification,
  listNotifications,
} = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, myNotifications);
router.patch('/:id/read', protect, markRead);
router.get('/', protect, restrictTo('super_admin'), listNotifications);
router.post('/', protect, restrictTo('super_admin'), createNotification);

module.exports = router;
