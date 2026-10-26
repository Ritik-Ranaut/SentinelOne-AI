const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema({
  chunkId: { type: String, required: true },
  content: { type: String, required: true },
  section: { type: String, default: '' },
  keywords: [{ type: String }]
}, { _id: false });

const KnowledgeDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    enum: ['POLICY', 'SOP', 'COMPLIANCE', 'PLAYBOOK', 'THREAT_ACTOR', 'INCIDENT_TEMPLATE'],
    default: 'POLICY',
    index: true
  },
  summary: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  chunks: [DocumentChunkSchema],
  tags: [{
    type: String
  }],
  uploadedBy: {
    type: String,
    default: 'System Administrator'
  },
  version: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

KnowledgeDocumentSchema.index({ title: 'text', content: 'text', summary: 'text' });

module.exports = mongoose.model('KnowledgeDocument', KnowledgeDocumentSchema);
