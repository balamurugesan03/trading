const express = require('express');
const { listUsers, getUser, suspendUser, activateUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictTo('super_admin'), listUsers);
router.get('/:id', protect, restrictTo('super_admin'), getUser);
router.patch('/:id/suspend', protect, restrictTo('super_admin'), suspendUser);
router.patch('/:id/activate', protect, restrictTo('super_admin'), activateUser);

module.exports = router;
