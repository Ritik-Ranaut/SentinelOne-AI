const mongoose = require('mongoose');

const ThreatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['BRUTE_FORCE', 'CREDENTIAL_STUFFING', 'PRIVILEGE_ESCALATION', 'DATA_EXFILTRATION', 'PORT_SCAN', 'IMPOSSIBLE_TRAVEL', 'API_ABUSE', 'INSIDER_THREAT'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  mitreTechnique: { type: String, default: 'T1078' },
  description: { type: String, default: '' },
  indicators: [{ type: String }],
  detectionCount: { type: Number, default: 1 },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'CONTAINED', 'RESOLVED'], default: 'ACTIVE' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Threat', ThreatSchema);
