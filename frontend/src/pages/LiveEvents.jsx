import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Pause,
  Trash2,
  Download,
  Filter,
  Search,
  Maximize2,
  Layers,
  X
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { SeverityBadge } from '../components/StatusBadge';
import GlassCard from '../components/GlassCard';

const EVENT_TYPE_OPTIONS = [
  'ALL',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'MFA_FAILURE',
  'ADMIN_ACCESS',
  'FILE_ACCESS',
  'FILE_DOWNLOAD',
  'API_REQUEST',
  'PORT_SCAN_SIMULATION',
  'SUSPICIOUS_IP',
  'UNUSUAL_LOCATION',
  'PRIVILEGE_CHANGE',
  'LARGE_DATA_TRANSFER'
];

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NORMAL'];

const LiveEvents = () => {
  const { liveLogs, isConnected, clearLiveLogs } = useSocket();
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const terminalEndRef = useRef(null);

  // Fetch initial historical logs from DB
  useEffect(() => {
    const loadInitialLogs = async () => {
      try {
        const res = await api.get('/logs?limit=80');
        if (res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      }
    };
    loadInitialLogs();
  }, []);

  // Sync new real-time websocket logs if not paused
  useEffect(() => {
    if (!isPaused && liveLogs.length > 0) {
      setLogs((prev) => {
        const newLogs = [...liveLogs, ...prev];
        // Deduplicate by _id or keep newest 200
        const seen = new Set();
        return newLogs.filter((l) => {
          const key = l._id || `${l.eventType}-${l.timestamp}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 300);
      });
    }
  }, [liveLogs, isPaused]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedSeverity !== 'ALL' && (log.severity || 'NORMAL') !== selectedSeverity) return false;
    if (selectedType !== 'ALL' && log.eventType !== selectedType) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match =
        log.username?.toLowerCase().includes(s) ||
        log.sourceIp?.toLowerCase().includes(s) ||
        log.eventType?.toLowerCase().includes(s) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const exportLogs = (format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-telemetry-${Date.now()}.json`;
      a.click();
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'EventType', 'Username', 'SourceIP', 'DeviceID', 'Severity', 'Details'];
      const rows = filteredLogs.map((l) => [
        new Date(l.timestamp).toISOString(),
        l.eventType,
        l.username,
        l.sourceIp,
        l.deviceId,
        l.severity,
        `"${(l.metadata?.details || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-telemetry-${Date.now()}.csv`;
      a.click();
    }
  };

  const getSeverityRowClass = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-950/20 border-l-2 border-l-red-500';
      case 'HIGH':
        return 'text-orange-400 bg-orange-950/15 border-l-2 border-l-orange-500';
      case 'MEDIUM':
        return 'text-amber-300 bg-amber-950/10 border-l-2 border-l-amber-500';
      case 'LOW':
        return 'text-emerald-400 border-l-2 border-l-emerald-500';
      default:
        return 'text-slate-300 border-l-2 border-l-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header with stream controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <TerminalIcon className="w-6 h-6 text-cyan-400" />
            <span>Live Security Telemetry Stream</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time event logging console with instant ingestion filters, forensic lookup, and data export.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-amber-300" /> : <Pause className="w-3.5 h-3.5 fill-cyan-300" />}
            <span>{isPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}</span>
          </button>

          <button
            onClick={() => {
              clearLiveLogs();
              setLogs([]);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
            <span>CLEAR</span>
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-colors">
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-30 font-mono text-xs">
              <button
                onClick={() => exportLogs('json')}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportLogs('csv')}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 border-t border-slate-800"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <GlassCard className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, IP, payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono placeholder:text-slate-500"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Event Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {EVENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Stream Stats Counter */}
          <div className="flex items-center justify-end space-x-3 text-xs font-mono text-slate-400">
            <span>Displaying: <strong className="text-cyan-400">{filteredLogs.length}</strong> events</span>
            {isPaused && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                PAUSED
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Terminal Viewport */}
      <div className="bg-[#05080f] rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-[#090d16] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] text-slate-400 pl-3">sentinel-telemetry-engine // /dev/pts/0</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            {isConnected ? 'Socket Stream: Connected' : 'Socket Stream: Offline'}
          </span>
        </div>

        {/* Stream Lines */}
        <div className="p-4 space-y-1 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 italic">
              No matching security events in telemetry buffer.
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={log._id || index}
                onClick={() => setSelectedLog(log)}
                className={`py-1.5 px-3 rounded flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition-colors ${getSeverityRowClass(
                  log.severity
                )}`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className="text-slate-500 text-[11px] select-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="font-bold tracking-wide">{log.eventType}</span>
                  <span className="text-slate-400">user={log.username}</span>
                  <span className="text-slate-500 hidden sm:inline">ip={log.sourceIp}</span>
                  <span className="text-slate-400 truncate max-w-[300px] hidden md:inline">
                    {log.metadata?.details || log.metadata?.reason || ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <SeverityBadge severity={log.severity} />
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Modal for Raw Log JSON Inspection */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1120] border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <TerminalIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">Raw Security Event Telemetry</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-[#05080f] p-4 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto max-h-96 border border-slate-800">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveEvents;
