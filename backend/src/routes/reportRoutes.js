const express = require('express');
const router = express.Router();
const {
  generateReport,
  getReports,
  getReportByIncidentId,
  downloadReportPdf
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getReports);
router.get('/:incidentId', protect, getReportByIncidentId);
router.get('/:incidentId/pdf', protect, downloadReportPdf);
router.post('/:incidentId', protect, authorize('ADMIN', 'ANALYST'), generateReport);

module.exports = router;
