const express = require('express');
const router = express.Router();
const {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  clearSimulation,
  getSimulationStatus
} = require('../controllers/simulationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/status', protect, getSimulationStatus);
router.post('/start', protect, authorize('ADMIN', 'ANALYST'), startSimulation);
router.post('/pause', protect, authorize('ADMIN', 'ANALYST'), pauseSimulation);
router.post('/resume', protect, authorize('ADMIN', 'ANALYST'), resumeSimulation);
router.post('/stop', protect, authorize('ADMIN', 'ANALYST'), stopSimulation);
router.post('/clear', protect, authorize('ADMIN'), clearSimulation);

module.exports = router;
