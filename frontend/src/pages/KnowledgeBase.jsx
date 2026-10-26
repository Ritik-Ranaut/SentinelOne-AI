import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Upload, FileText, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';

const KnowledgeBase = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'upload' | 'search'
  
  // Upload Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('POLICY');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Semantic RAG Search
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/rag/documents');
      if (res.data.success) {
        setDocs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    try {
      const res = await api.post('/rag/documents', {
        title: newTitle,
        category: newCategory,
        content: newContent,
        tags: newTags
      });

      if (res.data.success) {
        setUploadSuccess(true);
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        fetchDocs();
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    try {
      const res = await api.post('/rag/search', { query: ragQuery });
      if (res.data.success) {
        setRagResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rag/documents/${id}`);
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>RAG Security Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Enterprise SOPs, incident handling procedures & semantic retrieval grounding
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'browse' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Browse Documents
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'search' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semantic Search
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload SOP
          </button>
        </div>
      </div>

      {/* Tab: Browse Documents */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <GlassCard
                key={doc._id}
                title={doc.title}
                subtitle={`Category: ${doc.category}`}
                icon={FileText}
                action={
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                }
              >
                <div className="space-y-3 font-mono text-xs">
                  <p className="text-slate-300 line-clamp-3 text-[11px] leading-relaxed">
                    {doc.summary || doc.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                    {(doc.tags || []).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {doc.chunks?.length || 1} embedded chunks • By {doc.uploadedBy}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Semantic Search */}
      {activeTab === 'search' && (
        <div className="space-y-6 max-w-3xl">
          <form onSubmit={handleSemanticSearch} className="flex space-x-3">
            <input
              type="text"
              placeholder="Query security procedures (e.g. 'What is the lockout policy for failed logins?')..."
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-colors"
            >
              Search
            </button>
          </form>

          <div className="space-y-3">
            {ragResults.map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{r.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Relevance: {r.relevance}%
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed bg-[#05080f] p-3 rounded border border-slate-800">
                  "{r.excerpt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Upload SOP */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl bg-slate-900/60 p-6 rounded-xl border border-slate-800 font-mono text-xs space-y-4">
          <h3 className="text-sm font-bold text-white">Ingest New Security Documentation</h3>
          {uploadSuccess && (
            <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs">
              Document parsed, chunked, and stored successfully!
            </div>
          )}
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Incident Containment Standard 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="POLICY">Policy</option>
                <option value="SOP">SOP</option>
                <option value="PLAYBOOK">Playbook</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Policy Content (Markdown / Text)</label>
              <textarea
                rows={6}
                placeholder="Enter policy procedures, steps, and rules..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                placeholder="NIST, MFA, Lockout, Containment"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-glow-cyan"
            >
              Parse & Embed Document Chunks
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
