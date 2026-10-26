const express = require('express');
const router = express.Router();
const { getThreats, getThreatIndicators, lookupIndicator } = require('../controllers/threatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getThreats);
router.get('/indicators', protect, getThreatIndicators);
router.get('/lookup/:indicator', protect, lookupIndicator);

module.exports = router;
