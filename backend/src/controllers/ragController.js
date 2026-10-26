const KnowledgeDocument = require('../models/KnowledgeDocument');
const { recordAudit } = require('../services/auditService');

const getDocuments = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isActive: true };
    if (category && category !== 'ALL') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    const docs = await KnowledgeDocument.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const { title, category, content, summary, tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Chunk the document into ~500 character paragraphs for RAG matching
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const chunks = paragraphs.map((p, idx) => ({
      chunkId: `chunk-${idx + 1}`,
      content: p.trim(),
      section: `Paragraph ${idx + 1}`,
      keywords: p.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, 10)
    }));

    const doc = await KnowledgeDocument.create({
      title,
      category: category || 'POLICY',
      content,
      summary: summary || content.slice(0, 150) + '...',
      chunks,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
      uploadedBy: req.user?.username || 'Security Analyst'
    });

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: 'KNOWLEDGE_DOCUMENT_UPLOADED',
      resource: `Doc: ${title}`,
      metadata: { category: doc.category }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await KnowledgeDocument.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    doc.isActive = false;
    await doc.save();

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: 'KNOWLEDGE_DOCUMENT_DELETED',
      resource: `Doc: ${doc.title}`
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const searchKnowledge = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Search query is required' });

    const keywords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const regexList = keywords.map(k => new RegExp(k, 'i'));

    const docs = await KnowledgeDocument.find({
      isActive: true,
      $or: [
        { title: { $in: regexList } },
        { content: { $in: regexList } },
        { tags: { $in: regexList } }
      ]
    }).limit(5);

    // Extract most relevant chunk
    const results = docs.map(d => {
      let bestChunk = d.chunks[0]?.content || d.content.slice(0, 300);
      for (const ch of d.chunks) {
        if (keywords.some(k => ch.content.toLowerCase().includes(k))) {
          bestChunk = ch.content;
          break;
        }
      }
      return {
        id: d._id,
        title: d.title,
        category: d.category,
        excerpt: bestChunk,
        relevance: 95
      };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  deleteDocument,
  searchKnowledge
};
