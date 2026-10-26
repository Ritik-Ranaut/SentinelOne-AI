const mongoose = require('mongoose');

const TimelineItemSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  timeFormatted: { type: String, default: '' },
  event: { type: String, required: true },
  details: { type: String, default: '' },
  severity: { type: String, default: 'NORMAL' },
  sourceIp: { type: String, default: '' }
}, { _id: false });

const AgentFindingSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  status: { type: String, default: 'COMPLETE' },
  timestamp: { type: Date, default: Date.now },
  summary: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  confidence: { type: Number, default: 0.95 }
}, { _id: false });

const RiskFactorSchema = new mongoose.Schema({
  factor: { type: String, required: true },
  points: { type: Number, required: true },
  description: { type: String, default: '' }
}, { _id: false });

const RecommendationSchema = new mongoose.Schema({
  action: { type: String, required: true },
  reason: { type: String, required: true },
  priority: { type: String, default: 'HIGH' },
  requiresApproval: { type: Boolean, default: true },
  target: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED'], default: 'PENDING' }
}, { _id: false });

const IncidentSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  status: {
    type: String,
    enum: ['NEW', 'INVESTIGATING', 'PENDING_APPROVAL', 'ACTION_TAKEN', 'RESOLVED', 'FALSE_POSITIVE'],
    default: 'NEW',
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  aiExplanation: {
    type: String,
    default: ''
  },
  explanationSource: {
    type: String,
    enum: ['LLM', 'DETERMINISTIC_FALLBACK', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  affectedUsers: [{
    type: String,
    index: true
  }],
  sourceIps: [{
    type: String,
    index: true
  }],
  targetDevices: [{
    type: String
  }],
  relatedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityLog'
  }],
  timeline: [TimelineItemSchema],
  riskBreakdown: [RiskFactorSchema],
  agentFindings: [AgentFindingSchema],
  recommendations: [RecommendationSchema],
  assignedAnalyst: {
    type: String,
    default: 'Unassigned'
  },
  analystDecision: {
    decision: { type: String, enum: ['APPROVED', 'REJECTED', 'NONE'], default: 'NONE' },
    analystName: { type: String, default: '' },
    decisionNotes: { type: String, default: '' },
    timestamp: { type: Date }
  },
  simulationId: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

IncidentSchema.index({ createdAt: -1, severity: 1 });
IncidentSchema.index({ status: 1, riskScore: -1 });

module.exports = mongoose.model('Incident', IncidentSchema);
