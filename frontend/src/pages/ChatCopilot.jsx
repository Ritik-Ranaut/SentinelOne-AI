import React, { useState } from 'react';
import { MessageSquareCode, Send, Bot, User, Sparkles, Database, Terminal } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';

const SAMPLE_PROMPTS = [
  'Why is INC-1002 high risk?',
  'Show me the events related to admin',
  'Which incidents are currently critical?',
  'Summarize today\'s security activity',
  'What caused the risk score to increase?'
];

const ChatCopilot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Greetings Analyst. I am **SENTINEL AI Copilot**, connected to the live SOC telemetry database and LangGraph state engine. You can ask me to inspect incidents, correlate user identities, or summarize threats.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: query,
        conversationHistory: messages.slice(-4)
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.response,
            model: res.data.model,
            dbGrounded: !!res.data.contextData
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error communicating with AI Service: ${err.message}. Deterministic fallback active.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto font-sans h-[calc(100vh-5rem)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <MessageSquareCode className="w-6 h-6 text-cyan-400" />
            <span>SOC AI Copilot Analyst</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Grounded forensic investigation assistant • Queries live telemetry & incident state
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs font-mono text-cyan-400">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>DATABASE GROUNDED</span>
        </div>
      </div>

      {/* Chat History Viewport */}
      <div className="flex-1 bg-[#05080f] rounded-xl border border-slate-800 p-4 overflow-y-auto space-y-4 my-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-xl max-w-2xl text-xs font-mono leading-relaxed space-y-2 ${
                m.role === 'user'
                  ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-100'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.model && (
                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1 flex items-center justify-between">
                  <span>Engine: {m.model}</span>
                  {m.dbGrounded && <span className="text-cyan-400">Grounded in DB</span>}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 animate-pulse">
              Querying database telemetry & formulating grounded reasoning...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts & Input Box */}
      <div className="space-y-3">
        {/* Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-500 flex items-center space-x-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suggested:</span>
          </span>
          {SAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            placeholder="Ask SENTINEL Copilot (e.g. 'Why is INC-1002 high risk?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono text-xs font-bold flex items-center space-x-2 transition-colors shadow-glow-cyan"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatCopilot;
