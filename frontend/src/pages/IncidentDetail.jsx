import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Globe,
  HardDrive,
  Bot,
  FileText,
  History,
  ArrowLeft,
  RefreshCw,
  Terminal,
  Zap,
  Activity,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { SeverityBadge, StatusPill } from '../components/StatusBadge';
import RiskDial from '../components/RiskDial';
import GlassCard from '../components/GlassCard';

const IncidentDetail = () => {
  const { id } = useParams();
  const { latestIncident } = useSocket();
  const [incident, setIncident] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchIncident = async () => {
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.data.success) {
        setIncident(res.data.data);
        setAuditLogs(res.data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load incident:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  useEffect(() => {
    if (latestIncident && latestIncident.incidentId === id) {
      setIncident(latestIncident);
    }
  }, [latestIncident, id]);

  const handleDecision = async (actionIndex, decision) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/incidents/${id}/decision`, {
        actionIndex,
        decision,
        notes: decisionNotes || (decision === 'APPROVED' ? 'Action authorized by SOC analyst' : 'Action declined')
      });
      if (res.data.success) {
        setIncident(res.data.data);
        setToastMessage({
          type: decision === 'APPROVED' ? 'success' : 'warning',
          text: `Action ${decision.toLowerCase()} successfully! Audit log recorded.`
        });
        setDecisionNotes('');
        // Re-fetch audit logs
        fetchIncident();
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">ANALYZING INCIDENT DOSSIER #{id}...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Incident #{id} Not Found</h2>
        <Link to="/incidents" className="text-xs text-cyan-400 font-mono hover:underline">
          Return to Incident Queue
        </Link>
      </div>
    );
  }

  const user = incident.affectedUsers?.[0] || 'Unknown user';
  const ip = incident.sourceIps?.[0] || 'Unknown IP';
  const device = incident.targetDevices?.[0] || 'Unknown device';

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : toastMessage.type === 'error'
                ? 'bg-red-950/40 border-red-500/50 text-red-300'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/incidents"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-cyan-400">{incident.incidentId}</span>
              <span className="text-slate-500">•</span>
              <h1 className="text-xl font-bold text-white">{incident.title}</h1>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Detected on {new Date(incident.createdAt).toUTCString()} • Type: {incident.type}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/reports?incidentId=${incident.incidentId}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Executive Report</span>
          </Link>
        </div>
      </div>

      {/* Incident Status Banner Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-[#0b1120] border border-slate-800 shadow-xl items-center">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Status</div>
          <div className="mt-1.5">
            <StatusPill status={incident.status} />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Assigned: {incident.assignedAnalyst || 'Unassigned'}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Severity Level</div>
          <div className="mt-1.5">
            <SeverityBadge severity={incident.severity} pulse={incident.severity === 'CRITICAL'} />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Category: {incident.type}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Risk Evaluation</div>
          <div className="mt-1">
            <RiskDial score={incident.riskScore} size="lg" />
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Analyst Decision</div>
          <div className="mt-1 text-xs font-mono">
            {incident.analystDecision?.decision === 'APPROVED' ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVED ({incident.analystDecision.analystName || 'Analyst'})</span>
              </span>
            ) : incident.analystDecision?.decision === 'REJECTED' ? (
              <span className="text-red-400 font-bold flex items-center space-x-1">
                <XCircle className="w-4 h-4" />
                <span>REJECTED</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center space-x-1">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>PENDING SIGN-OFF</span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
            {incident.analystDecision?.decisionNotes || 'Awaiting human authorization'}
          </div>
        </div>
      </div>

      {/* Row 1: AI Explanation & Risk Factor Breakdown (Deterministic Math) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 2: AI Explanation */}
        <GlassCard
          title="Investigation Explanation"
          subtitle={incident.explanationSource === 'LLM'
            ? 'LLM-written narrative; the risk score remains deterministic'
            : incident.explanationSource === 'DETERMINISTIC_FALLBACK'
              ? 'Deterministic fallback narrative; no LLM response was used'
              : 'Explanation source was not recorded for this incident'}
          icon={Bot}
          className="lg:col-span-2"
        >
          <div className="space-y-4 font-sans text-xs text-slate-200 leading-relaxed bg-[#05080f] p-4 rounded-lg border border-slate-800">
            <p className="text-sm font-medium text-cyan-300">
              "{incident.aiExplanation || 'Automated multi-agent heuristics triggered by abnormal telemetry velocity.'}"
            </p>
            <div className="border-t border-slate-800/80 pt-3 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Incident Scope: Targeted user account <strong className="text-slate-200">'{user}'</strong> from IP origin <strong className="text-slate-200">'{ip}'</strong>.</div>
              <div>MITRE ATT&CK Classification: <strong className="text-cyan-400">{incident.type}</strong></div>
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Contributing Risk Factors Math */}
        <GlassCard
          title="Deterministic Risk Math"
          subtitle="Explainable score calculation breakdown"
          icon={Zap}
        >
          <div className="space-y-2.5 font-mono text-xs">
            {incident.riskBreakdown && incident.riskBreakdown.length > 0 ? (
              incident.riskBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60"
                >
                  <div className="truncate max-w-[200px]">
                    <div className="font-semibold text-slate-200 truncate">{item.factor}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                  </div>
                  <span className="font-bold text-amber-400 pl-2">+{item.points}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic text-center py-4">Baseline telemetry applied.</div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold text-slate-100">
              <span>Total Aggregate Risk</span>
              <span className="text-red-400 text-sm">{incident.riskScore} / 100</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Human-in-the-Loop Defensive Response Actions Panel */}
      <GlassCard
        title="Automated Defensive Response Recommendations (Human-in-the-Loop)"
        subtitle="Analyst sign-off required before applying active network containment playbooks"
        icon={ShieldCheck}
        className="border-cyan-500/30 shadow-glow-cyan"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(incident.recommendations || []).map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {rec.priority || 'HIGH'}
                      </span>
                      <h4 className="text-sm font-bold text-white">{rec.action}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{rec.reason}</p>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Target Entity: <strong className="text-slate-300">{rec.target || ip}</strong>
                    </div>
                  </div>

                  <div>
                    {rec.status === 'EXECUTED' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40">
                        EXECUTED
                      </span>
                    ) : rec.status === 'APPROVED' ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/40">
                        APPROVED
                      </span>
                    ) : rec.status === 'REJECTED' ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-mono border border-red-500/40">
                        DECLINED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/40 animate-pulse">
                        AWAITING APPROVAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Authorization Buttons */}
                {rec.requiresApproval && rec.status === 'PENDING' && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Optional authorization notes..."
                      aria-label={`Authorization notes for ${rec.action}`}
                      maxLength={500}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      className="w-full bg-[#05080f] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleDecision(idx, 'APPROVED')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors shadow-glow-green"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleDecision(idx, 'REJECTED')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/50 text-xs font-mono font-bold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Row 3: Visual Timeline & Affected Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 4: Visual Timeline */}
        <GlassCard
          title="Chronological Forensic Timeline"
          subtitle="Sequential telemetry events correlated during initial compromise"
          icon={Clock}
          className="lg:col-span-2"
        >
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {incident.timeline && incident.timeline.length > 0 ? (
              incident.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline bullet dot */}
                  <span
                    className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-[#080c14] ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-500 ring-2 ring-red-500/30'
                        : item.severity === 'HIGH'
                        ? 'bg-orange-500'
                        : item.severity === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-400 font-bold">{item.timeFormatted || '10:00:00'}</span>
                        <span className="text-slate-200 font-semibold">{item.event}</span>
                      </div>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">{item.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic py-4">No chronological events registered.</div>
            )}
          </div>
        </GlassCard>

        {/* Affected Entities (User, IP, Device Cards) */}
        <div className="space-y-4">
          {/* User Card */}
          <GlassCard title="Target Account" icon={User}>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Username:</span>
                <span className="text-slate-200 font-bold">{user}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Identity Risk:</span>
                <span className="text-orange-400 font-bold">ELEVATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Directory Status:</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </GlassCard>

          {/* IP Card */}
          <GlassCard title="Source IP Intel" icon={Globe}>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">IP Address:</span>
                <span className="text-cyan-400 font-bold">{ip}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Reputation:</span>
                <span className="text-red-400 font-bold">MALICIOUS (92%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Autonomous System:</span>
                <span className="text-slate-300">AS-TorNodes-Sim</span>
              </div>
            </div>
          </GlassCard>

          {/* Device Card */}
          <GlassCard title="Target Asset" icon={HardDrive}>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Device ID:</span>
                <span className="text-slate-200 font-bold">{device}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">EDR Agent:</span>
                <span className="text-emerald-400">CONNECTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Host Status:</span>
                <span className="text-cyan-400 font-bold">MONITORED</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Row 4: Multi-Agent Forensic Findings */}
      <GlassCard
        title="Multi-Agent Forensic Execution Dossier"
        subtitle="Individual agent conclusions from LangGraph execution"
        icon={Bot}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(incident.agentFindings || []).map((finding, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-[11px] truncate">
                  {finding.agentName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  {finding.status || 'OK'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {finding.summary}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Row 5: Audit History for this Incident */}
      <GlassCard
        title="Audit Trail & Chain of Custody"
        subtitle="Immutable logging of all analyst decisions and status changes"
        icon={History}
      >
        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
          {auditLogs.length === 0 ? (
            <div className="text-slate-500 italic py-3">No analyst actions logged for this incident yet.</div>
          ) : (
            auditLogs.map((log, idx) => (
              <div
                key={log._id || idx}
                className="flex items-center justify-between py-1.5 px-3 rounded bg-slate-900/40 border border-slate-800/60"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold text-cyan-300">{log.action}</span>
                  <span className="text-slate-400">by {log.user}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {log.result || 'SUCCESS'}
                </span>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default IncidentDetail;
