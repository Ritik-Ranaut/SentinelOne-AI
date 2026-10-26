const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.patch('/:id/status', protect, authorize('ADMIN'), updateUserStatus);

module.exports = router;
