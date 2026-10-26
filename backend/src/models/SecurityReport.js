const mongoose = require('mongoose');

const SecurityReportSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  executiveSummary: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    required: true
  },
  markdownContent: {
    type: String,
    required: true
  },
  findings: [{
    agentName: String,
    summary: String
  }],
  timelineSummary: [{
    time: String,
    event: String,
    detail: String
  }],
  remediationSteps: [{
    step: String,
    status: String
  }],
  generatedBy: {
    type: String,
    default: 'Report Agent'
  },
  analystSignOff: {
    type: String,
    default: null
  },
  exportedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SecurityReport', SecurityReportSchema);
