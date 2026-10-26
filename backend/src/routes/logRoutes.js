const express = require('express');
const router = express.Router();
const { getLogs, ingestLog, clearLogs } = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getLogs);
router.post('/', protect, ingestLog);
router.delete('/clear', protect, authorize('ADMIN'), clearLogs);

module.exports = router;
