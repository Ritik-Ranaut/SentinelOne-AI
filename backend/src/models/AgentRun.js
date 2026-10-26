const mongoose = require('mongoose');

const AgentRunSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    index: true
  },
  incidentId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING_APPROVAL'],
    default: 'PENDING',
    index: true
  },
  currentTask: {
    type: String,
    default: 'Idle'
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

AgentRunSchema.index({ startedAt: -1 });

module.exports = mongoose.model('AgentRun', AgentRunSchema);
