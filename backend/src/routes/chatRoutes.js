const express = require('express');
const router = express.Router();
const { queryCopilot } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/', protect, queryCopilot);

module.exports = router;
