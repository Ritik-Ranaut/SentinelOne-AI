const mongoose = require('mongoose');

const ResponseActionSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: [
      'VERIFY_IDENTITY',
      'FORCE_PASSWORD_RESET',
      'REVOKE_ACTIVE_SESSIONS',
      'DISABLE_ACCOUNT',
      'BLOCK_IP',
      'ISOLATE_HOST',
      'INCREASE_MONITORING',
      'PRESERVE_LOGS',
      'ESCALATE_TIER3'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED'],
    default: 'PENDING',
    index: true
  },
  analyst: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  executedAt: {
    type: Date
  },
  executionLog: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResponseAction', ResponseActionSchema);
