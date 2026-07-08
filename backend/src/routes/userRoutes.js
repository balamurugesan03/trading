const express = require('express');
const {
  listUsers,
  getUser,
  suspendUser,
  activateUser,
  updateUser,
  resetPassword,
  impersonateUser,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictTo('super_admin'), listUsers);
router.get('/:id', protect, restrictTo('super_admin'), getUser);
router.patch('/:id', protect, restrictTo('super_admin'), updateUser);
router.patch('/:id/reset-password', protect, restrictTo('super_admin'), resetPassword);
router.patch('/:id/suspend', protect, restrictTo('super_admin'), suspendUser);
router.patch('/:id/activate', protect, restrictTo('super_admin'), activateUser);
router.post('/:id/impersonate', protect, restrictTo('super_admin'), impersonateUser);

module.exports = router;
