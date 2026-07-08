const express = require('express');
const {
  myNotifications,
  myUnreadCount,
  markRead,
  markAllRead,
  createNotification,
  listNotifications,
  toggleActive,
} = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, myNotifications);
router.get('/my/unread-count', protect, myUnreadCount);
router.patch('/my/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);
router.get('/', protect, restrictTo('super_admin'), listNotifications);
router.post('/', protect, restrictTo('super_admin'), createNotification);
router.patch('/:id/toggle', protect, restrictTo('super_admin'), toggleActive);

module.exports = router;
