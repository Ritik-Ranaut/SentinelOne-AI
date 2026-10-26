const mongoose = require('mongoose');

const ThreatIndicatorSchema = new mongoose.Schema({
  indicator: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['IP', 'DOMAIN', 'HASH', 'URL', 'EMAIL'],
    required: true
  },
  reputation: {
    type: String,
    enum: ['MALICIOUS', 'SUSPICIOUS', 'UNKNOWN', 'BENIGN'],
    default: 'SUSPICIOUS'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  threatGroup: {
    type: String,
    default: 'APT-Simulation'
  },
  associatedThreats: [{
    type: String
  }],
  lastReported: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ThreatIndicator', ThreatIndicatorSchema);
