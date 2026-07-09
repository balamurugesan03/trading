const express = require('express');
const { register, login, me, updateAvatar, getSponsorByCode } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/me/avatar', protect, upload.single('avatar'), updateAvatar);
router.get('/sponsor/:code', getSponsorByCode);

module.exports = router;
