const express = require('express');
const {
  myMessages,
  sendMyMessage,
  markMyRead,
  myUnreadCount,
  listConversations,
  unreadCount,
  getConversation,
  sendAdminMessage,
  markConversationRead,
} = require('../controllers/supportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/my/messages', protect, myMessages);
router.post('/my/messages', protect, sendMyMessage);
router.patch('/my/read', protect, markMyRead);
router.get('/my/unread-count', protect, myUnreadCount);

router.get('/conversations', protect, restrictTo('super_admin'), listConversations);
router.get('/unread-count', protect, restrictTo('super_admin'), unreadCount);
router.get('/conversations/:customerId/messages', protect, restrictTo('super_admin'), getConversation);
router.post('/conversations/:customerId/messages', protect, restrictTo('super_admin'), sendAdminMessage);
router.patch('/conversations/:customerId/read', protect, restrictTo('super_admin'), markConversationRead);

module.exports = router;
