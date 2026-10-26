const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  updateIncident,
  handleAnalystDecision
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentById);
router.patch('/:id', protect, authorize('ADMIN', 'ANALYST'), updateIncident);
router.post('/:id/decision', protect, authorize('ADMIN', 'ANALYST'), handleAnalystDecision);

module.exports = router;
