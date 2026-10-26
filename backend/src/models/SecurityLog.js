const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  sourceIp: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    default: 'DEV-UNKNOWN',
    index: true
  },
  location: {
    country: { type: String, default: 'US' },
    city: { type: String, default: 'San Francisco' },
    latitude: { type: Number, default: 37.7749 },
    longitude: { type: Number, default: -122.4194 }
  },
  severity: {
    type: String,
    enum: ['NORMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'NORMAL',
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  simulationId: {
    type: String,
    default: null,
    index: true
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  processedByAI: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

SecurityLogSchema.index({ timestamp: -1, severity: 1 });
SecurityLogSchema.index({ username: 1, timestamp: -1 });
SecurityLogSchema.index({ sourceIp: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);
