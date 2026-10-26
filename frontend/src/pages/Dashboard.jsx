import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Bot,
  Zap,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Terminal as TerminalIcon,
  Play
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import GlassCard from '../components/GlassCard';
import { SeverityBadge, StatusPill } from '../components/StatusBadge';
import RiskDial from '../components/RiskDial';

const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#06b6d4', '#8b5cf6'];

const Dashboard = () => {
  const { liveLogs, simulationStatus, latestIncident, isConnected } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data);
        setError('');
      } else {
        throw new Error(res.data.message || 'Dashboard metrics are unavailable.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Dashboard metrics are unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reactively re-sync metrics whenever a new incident is created or simulation finishes
  useEffect(() => {
    if (latestIncident || simulationStatus.status === 'COMPLETED') {
      fetchStats();
    }
  }, [latestIncident, simulationStatus.status]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">CONNECTING TO SOC METRICS ENGINE...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-3xl mx-auto" role="alert">
        <div className="border border-red-900/70 bg-red-950/30 p-5">
          <h1 className="text-lg font-semibold text-white">Dashboard data unavailable</h1>
          <p className="mt-2 text-sm text-slate-300">{error || 'The metrics service did not return data.'}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-4 border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};
  const recentIncidents = stats?.recentIncidents || [];
  const displayLogs = liveLogs.length > 0 ? liveLogs.slice(0, 8) : (stats?.recentLogs || []).slice(0, 8);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Banner / Quick Simulation trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <span>Security Operations Center</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              DEFENSIVE PLATFORM
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Autonomous multi-agent correlation • Real-time telemetry monitoring • MITRE ATT&CK alignment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/simulations"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-all shadow-glow-cyan"
          >
            <Play className="w-3.5 h-3.5 fill-cyan-400" />
            <span>OPEN SIMULATION CENTER</span>
          </Link>
          <button
            onClick={fetchStats}
            title="Refresh Metrics"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div role="status" className="border border-amber-800/70 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Refresh failed. Showing the last successful metrics. {error}
        </div>
      )}

      {/* Top KPI Cards (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <GlassCard className="!p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Events</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {kpis.totalEvents == null ? '—' : kpis.totalEvents.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>{isConnected ? 'Telemetry connected' : 'Telemetry offline'}</span>
          </div>
        </GlassCard>

        <GlassCard className="!p-4 border-l-2 border-l-red-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Active Incidents</div>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">
            {kpis.activeIncidents ?? '—'}
          </div>
          <div className="text-[10px] text-red-400 font-mono mt-2 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Triage queue</span>
          </div>
        </GlassCard>

        <GlassCard className="!p-4 border-l-2 border-l-red-600">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Critical Threats</div>
          <div className="text-2xl font-bold text-red-500 font-mono mt-1">
            {kpis.criticalThreats ?? '—'}
          </div>
          <div className="text-[10px] text-red-500 font-mono mt-2 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Immediate review</span>
          </div>
        </GlassCard>

        <GlassCard className="!p-4 border-l-2 border-l-orange-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">High Threats</div>
          <div className="text-2xl font-bold text-orange-400 font-mono mt-1">
            {kpis.highThreats ?? '—'}
          </div>
          <div className="text-[10px] text-orange-400 font-mono mt-2 flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Elevated risk</span>
          </div>
        </GlassCard>

        <GlassCard className="!p-4 border-l-2 border-l-emerald-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Resolved Incidents</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {kpis.resolvedIncidents ?? '—'}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Remediated</span>
          </div>
        </GlassCard>

        <GlassCard className="!p-4 border-l-2 border-l-cyan-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Active Agents</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {kpis.activeAgents ?? '—'}
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center space-x-1">
            <Bot className="w-3 h-3" />
            <span>{kpis.activeAgents == null ? 'Not reported' : 'Reported by service'}</span>
          </div>
        </GlassCard>
      </div>

      {/* Row 1 Charts: Security Events Over Time & Threat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Security Events Over Time */}
        <GlassCard
          title="Security Telemetry Over Time"
          subtitle="Hourly stream volume vs anomalous threshold spikes"
          icon={Activity}
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.eventsOverTime || []}>
                <defs>
                  <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anomGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#eventGradient)" name="Total Events" />
                <Area type="monotone" dataKey="anomalies" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#anomGradient)" name="Anomalies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 2: Threat Distribution */}
        <GlassCard
          title="Threat Category Distribution"
          subtitle="Proportion of detected TTP tactics"
          icon={ShieldAlert}
        >
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.threatDistribution || []}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.threatDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            {(charts.threatDistribution || []).slice(0, 4).map((t, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 truncate">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="truncate">{t.name}: {t.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Row 2 Charts: Incident Severity, Event Type Distribution, Risk Bins */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 3: Incident Severity */}
        <GlassCard
          title="Incidents by Severity"
          subtitle="Categorized breakdown of open cases"
          icon={AlertTriangle}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.incidentSeverity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(charts.incidentSeverity || []).map((entry, index) => (
                    <Cell key={`cell-sev-${index}`} fill={entry.fill || '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 4: Event Type Distribution */}
        <GlassCard
          title="Event Type Ingestion"
          subtitle="Top telemetry categories processed"
          icon={TerminalIcon}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.eventTypeDistribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis dataKey="type" type="category" stroke="#64748b" fontSize={9} width={95} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 5: Risk Score Distribution */}
        <GlassCard
          title="Risk Score Distribution"
          subtitle="Incident risk scores clustered in bins"
          icon={Zap}
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.riskScoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={9} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Live Event Stream Terminal & Active Incidents Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Terminal Stream */}
        <GlassCard
          title="Real-Time Telemetry Stream"
          subtitle="Live raw security logs delivered via WebSockets"
          icon={TerminalIcon}
          action={
            <Link to="/live-events" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1">
              <span>Expand Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="bg-[#05080f] rounded-lg p-3 font-mono text-xs border border-slate-800/80 space-y-2 max-h-80 overflow-y-auto">
            {displayLogs.length === 0 ? (
              <p className="text-slate-500 italic">Waiting for incoming telemetry events...</p>
            ) : (
              displayLogs.map((log, idx) => (
                <div key={log._id || idx} className="flex items-start justify-between py-1 border-b border-slate-900/60 hover:bg-slate-900/40 px-1 rounded transition-colors">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span className="font-semibold text-slate-200">{log.eventType}</span>
                    <span className="text-slate-400 truncate max-w-[160px]">user={log.username}</span>
                    <span className="text-slate-500 hidden sm:inline">ip={log.sourceIp}</span>
                  </div>
                  <SeverityBadge severity={log.severity} />
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Active Incidents */}
        <GlassCard
          title="Active Incident Triage"
          subtitle="Top security incidents under multi-agent investigation"
          icon={ShieldAlert}
          action={
            <Link to="/incidents" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentIncidents.length === 0 ? (
              <p className="text-slate-500 italic">No active incidents in queue.</p>
            ) : (
              recentIncidents.map((inc) => (
                <Link
                  key={inc._id}
                  to={`/incidents/${inc.incidentId}`}
                  className="block p-3 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 transition-all hover:border-slate-700 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                        {inc.incidentId}
                      </span>
                      <span className="text-xs text-slate-200 font-medium truncate max-w-[220px]">
                        {inc.title}
                      </span>
                    </div>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span>User: {inc.affectedUsers?.[0] || 'unknown'}</span>
                      <StatusPill status={inc.status} />
                    </div>
                    <RiskDial score={inc.riskScore} size="sm" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
