const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many authentication attempts. Try again later.' }
});

const registrationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many registration attempts. Try again later.' }
});

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
