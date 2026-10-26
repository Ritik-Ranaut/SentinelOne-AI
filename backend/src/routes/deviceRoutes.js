const express = require('express');
const router = express.Router();
const { getDevices, isolateDevice } = require('../controllers/deviceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getDevices);
router.post('/:id/isolate', protect, authorize('ADMIN', 'ANALYST'), isolateDevice);

module.exports = router;
