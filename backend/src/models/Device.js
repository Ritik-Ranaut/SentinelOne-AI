const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostname: {
    type: String,
    default: 'workstation'
  },
  user: {
    type: String,
    required: true,
    index: true
  },
  os: {
    type: String,
    default: 'Windows 11 Pro'
  },
  ip: {
    type: String,
    required: true,
    index: true
  },
  macAddress: {
    type: String,
    default: '00:1A:2B:3C:4D:5E'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  riskScore: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['HEALTHY', 'FLAGGED', 'SUSPICIOUS', 'ISOLATED'],
    default: 'HEALTHY'
  },
  anomalyIndicators: [{
    type: String
  }],
  incidentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Device', DeviceSchema);
