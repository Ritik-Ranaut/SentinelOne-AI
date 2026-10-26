import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { SeverityBadge, StatusPill } from '../components/StatusBadge';
import RiskDial from '../components/RiskDial';
import GlassCard from '../components/GlassCard';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUS_FILTERS = ['ALL', 'NEW', 'INVESTIGATING', 'PENDING_APPROVAL', 'ACTION_TAKEN', 'RESOLVED'];
const TYPE_FILTERS = [
  'ALL',
  'BRUTE_FORCE',
  'CREDENTIAL_ATTACK',
  'PRIVILEGE_ESCALATION',
  'DATA_EXFILTRATION',
  'PORT_SCAN',
  'IMPOSSIBLE_TRAVEL',
  'API_ABUSE',
  'INSIDER_THREAT'
];

const Incidents = () => {
  const { latestIncident } = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [minRisk, setMinRisk] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(severity !== 'ALL' && { severity }),
        ...(status !== 'ALL' && { status }),
        ...(type !== 'ALL' && { type }),
        ...(searchTerm && { search: searchTerm }),
        ...(minRisk && { minRisk })
      });

      const res = await api.get(`/incidents?${params.toString()}`);
      if (res.data.success) {
        setIncidents(res.data.data);
        setTotalPages(res.data.pagination.pages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, severity, status, type]);

  // When a new incident arrives over WebSockets, refresh the list
  useEffect(() => {
    if (latestIncident) {
      fetchIncidents();
    }
  }, [latestIncident]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIncidents();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <AlertOctagon className="w-6 h-6 text-red-400" />
            <span>Incident Management</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated multi-agent investigation queue • Human-in-the-loop authorization • Forensics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">
            Total Cases: <strong className="text-cyan-400">{totalCount}</strong>
          </span>
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <GlassCard className="!p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, title, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-slate-500"
            />
          </div>

          {/* Severity */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Severity:</span>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500"
            >
              {SEVERITY_FILTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>{st.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Type:</span>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors"
            >
              APPLY FILTERS
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Incidents Table */}
      <div className="bg-[#05080f] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#090d16] text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Incident ID</th>
                <th className="py-3.5 px-4 font-semibold">Incident Title</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Target User</th>
                <th className="py-3.5 px-4 font-semibold">Source IP</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Analyst</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 italic">
                    Loading incident queue...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 italic">
                    No incidents matching current criteria.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc._id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      <Link to={`/incidents/${inc.incidentId}`} className="hover:underline">
                        {inc.incidentId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100 max-w-[280px] truncate">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{inc.riskScore}</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              inc.riskScore > 80
                                ? 'bg-red-500'
                                : inc.riskScore > 60
                                ? 'bg-orange-500'
                                : inc.riskScore > 30
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${inc.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inc.affectedUsers?.[0] || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {inc.sourceIps?.[0] || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={inc.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {inc.assignedAnalyst || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/incidents/${inc.incidentId}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-[#090d16] px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Incidents;
