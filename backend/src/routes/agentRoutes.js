const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentRuns,
  triggerManualInvestigation
} = require('../controllers/agentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAgents);
router.get('/runs', protect, getAgentRuns);
router.post('/investigate', protect, authorize('ADMIN', 'ANALYST'), triggerManualInvestigation);

module.exports = router;
