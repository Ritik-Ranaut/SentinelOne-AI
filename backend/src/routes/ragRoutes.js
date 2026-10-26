const express = require('express');
const router = express.Router();
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
  searchKnowledge
} = require('../controllers/ragController');
const { protect, authorize } = require('../middleware/auth');

router.get('/documents', protect, getDocuments);
router.post('/documents', protect, authorize('ADMIN', 'ANALYST'), uploadDocument);
router.delete('/documents/:id', protect, authorize('ADMIN'), deleteDocument);
router.post('/search', protect, searchKnowledge);

module.exports = router;
