const express = require('express');
const { listPackages, listPublicPackages, createPackage, updatePackage } = require('../controllers/packageController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/public', listPublicPackages);
router.get('/', protect, listPackages);
router.post('/', protect, restrictTo('super_admin'), createPackage);
router.patch('/:id', protect, restrictTo('super_admin'), updatePackage);

module.exports = router;
