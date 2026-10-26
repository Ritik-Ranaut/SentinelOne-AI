import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs?limit=50');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.user?.toLowerCase().includes(s) ||
      l.action?.toLowerCase().includes(s) ||
      l.resource?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>Immutable Audit & Compliance Log</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Complete tamper-evident trail of analyst authorizations, incident updates, and simulation triggers
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Filter */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search user, action, affected resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#05080f] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#090d16] text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">Security Action</th>
                <th className="py-3.5 px-4 font-semibold">Affected Resource</th>
                <th className="py-3.5 px-4 font-semibold">Client Origin</th>
                <th className="py-3.5 px-4 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {log.user}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-cyan-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-[320px] truncate">
                    {log.resource}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.result === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
