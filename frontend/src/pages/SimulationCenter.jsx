import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlaySquare,
  Play,
  Pause,
  Square,
  Trash2,
  AlertTriangle,
  Bot,
  Activity,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import GlassCard from '../components/GlassCard';

const SCENARIOS_DEF = [
  {
    id: 'BRUTE_FORCE',
    name: 'Brute-Force Authentication',
    category: 'CREDENTIAL_ATTACK',
    description: 'Rapid successive failed logins targeting admin from German Tor node, followed by successful authentication and admin access.',
    icon: ShieldAlert,
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/40',
    steps: 8,
    target: 'admin (185.220.101.42)'
  },
  {
    id: 'SUSPICIOUS_LOGIN',
    name: 'Suspicious Login Anomaly',
    category: 'ANOMALOUS_ACCESS',
    description: 'Access from an untrusted residential proxy subnet at 03:22 AM local time without enrolled device certificate.',
    icon: AlertTriangle,
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/40',
    steps: 3,
    target: 'sarah.connor (45.154.255.89)'
  },
  {
    id: 'PRIVILEGE_ESCALATION',
    name: 'Privilege Escalation',
    category: 'INTERNAL_ATTACK',
    description: 'Junior developer account alters IAM roles in database granting itself Global Domain Administrator rights.',
    icon: Cpu,
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/40',
    steps: 4,
    target: 'jason.dev (10.10.4.155)'
  },
  {
    id: 'DATA_EXFILTRATION',
    name: 'Data Exfiltration / Large Transfer',
    category: 'DATA_LEAK',
    description: 'Bulk query on customer PII database followed by 4.8 GB outbound encrypted archive transfer to untrusted cloud bucket.',
    icon: Terminal,
    color: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/40',
    steps: 3,
    target: 'michael.scott (192.168.1.77)'
  },
  {
    id: 'PORT_SCAN',
    name: 'Port Scanning & Reconnaissance',
    category: 'RECONNAISSANCE',
    description: 'Rapid sequential TCP SYN probing across internal server segment targeting ports 22, 445, 3389, 8080.',
    icon: Activity,
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/40',
    steps: 4,
    target: 'unknown_scanner (172.16.50.200)'
  },
  {
    id: 'IMPOSSIBLE_TRAVEL',
    name: 'Impossible Travel Anomaly',
    category: 'IDENTITY_THEFT',
    description: 'Legitimate login in San Francisco followed 8 minutes later by interactive login from Tokyo, Japan.',
    icon: PlaySquare,
    color: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/40',
    steps: 3,
    target: 'elena.rostova (133.242.18.99)'
  },
  {
    id: 'ABNORMAL_API',
    name: 'Abnormal API Activity',
    category: 'API_ABUSE',
    description: 'Automated script injecting malformed JWT signatures and parameter tampering triggering 401/403 bursts.',
    icon: Bot,
    color: 'from-teal-500/20 to-emerald-500/20',
    borderColor: 'border-teal-500/40',
    steps: 4,
    target: 'service_api_key_88 (198.51.100.188)'
  }
];

const SimulationCenter = () => {
  const { isAdmin } = useAuth();
  const { simulationStatus, liveLogs } = useSocket();
  const [loading, setLoading] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('BRUTE_FORCE');
  const [statusMessage, setStatusMessage] = useState('');

  const handleStart = async (scenarioId) => {
    setLoading(true);
    try {
      setActiveScenarioId(scenarioId);
      const res = await api.post('/simulations/start', { scenario: scenarioId });
      if (res.data.success) {
        setStatusMessage(`Started ${res.data.scenarioName}. Streaming telemetry events...`);
      }
    } catch (err) {
      setStatusMessage(`Failed to start: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      const res = await api.post('/simulations/pause');
      setStatusMessage(res.data.message || 'Simulation paused.');
    } catch (err) {
      setStatusMessage(`Failed to pause: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleResume = async () => {
    try {
      const res = await api.post('/simulations/resume');
      setStatusMessage(res.data.message || 'Simulation resumed.');
    } catch (err) {
      setStatusMessage(`Failed to resume: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.post('/simulations/stop');
      setStatusMessage(res.data.message || 'Simulation stopped.');
    } catch (err) {
      setStatusMessage(`Failed to stop: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Permanently delete all synthetic simulation logs and incidents?')) return;
    try {
      const res = await api.post('/simulations/clear');
      setStatusMessage(res.data.message || 'Simulation data cleared.');
    } catch (err) {
      setStatusMessage(`Failed to clear simulation data: ${err.response?.data?.message || err.message}`);
    }
  };

  const isRunning = simulationStatus.status === 'RUNNING';
  const isPaused = simulationStatus.status === 'PAUSED';
  const pct = simulationStatus.totalSteps ? Math.round((simulationStatus.currentStep / simulationStatus.totalSteps) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <PlaySquare className="w-6 h-6 text-cyan-400" />
            <span>Attack Simulation Center</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Generate realistic synthetic telemetry • Trigger autonomous LangGraph agents • Test defense playbooks
          </p>
        </div>

  {statusMessage && <p role="status" className="text-sm text-slate-200">{statusMessage}</p>}

        {/* Global Control Bar */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RESUME</span>
            </button>
          ) : null}

          <button
            onClick={handleStop}
            disabled={!isRunning && !isPaused}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 disabled:opacity-40 text-red-300 border border-red-700/50 text-xs font-mono"
          >
            <Square className="w-3.5 h-3.5" />
            <span>STOP</span>
          </button>

          <button
            onClick={handleClear}
            disabled={!isAdmin}
            title={isAdmin ? 'Clear synthetic simulation records' : 'Administrator access required'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-mono"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR SIMULATION DATA</span>
          </button>
        </div>
      </div>

      {/* Live Simulation Progress & Pipeline HUD */}
      <GlassCard
        title={simulationStatus.scenarioName ? `Active Scenario: ${simulationStatus.scenarioName}` : 'Simulation Engine Standby'}
        subtitle="End-to-end multi-agent execution pipeline"
        icon={Activity}
        className="border-cyan-500/30"
      >
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Execution Progress: {simulationStatus.currentStep || 0} / {simulationStatus.totalSteps || 0} Events Emitted</span>
              <span className="text-cyan-400 font-bold">{pct}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Interactive Pipeline Nodes (Generator -> Ingestion -> Agents -> Incident) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className={`p-3 rounded-lg border font-mono text-xs ${isRunning ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>1. Synthetic Stream</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Generating telemetry logs</p>
            </div>

            <div className={`p-3 rounded-lg border font-mono text-xs ${simulationStatus.currentStep > 0 ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold">2. Log Normalization</div>
              <p className="text-[10px] text-slate-400 mt-1">Socket.IO real-time broadcast</p>
            </div>

            <div className={`p-3 rounded-lg border font-mono text-xs ${simulationStatus.currentStep >= 3 ? 'bg-purple-950/30 border-purple-500/40 text-purple-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Multi-Agent Team</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">LangGraph state evaluation</p>
            </div>

            <div className={`p-3 rounded-lg border font-mono text-xs ${simulationStatus.incidentId ? 'bg-red-950/30 border-red-500/40 text-red-300' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
              <div className="font-bold flex items-center justify-between">
                <span>4. Incident Created</span>
                {simulationStatus.incidentId && (
                  <Link
                    to={`/incidents/${simulationStatus.incidentId}`}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-0.5"
                  >
                    <span>{simulationStatus.incidentId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Risk score & playbooks</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 7 Scenario Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">
          Select Simulated Attack Vector ({SCENARIOS_DEF.length} Available)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SCENARIOS_DEF.map((scenario) => {
            const Icon = scenario.icon;
            const isThisRunning = simulationStatus.scenarioKey === scenario.id && isRunning;

            return (
              <div
                key={scenario.id}
                className={`p-5 rounded-xl bg-slate-900/50 border transition-all hover:border-cyan-500/50 hover:shadow-glow-cyan flex flex-col justify-between space-y-4 ${
                  isThisRunning ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{scenario.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {scenario.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {scenario.steps} Events
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 truncate">
                    Target: <strong className="text-slate-200">{scenario.target}</strong>
                  </div>
                </div>

                <button
                  disabled={loading || isRunning || isPaused}
                  onClick={() => handleStart(scenario.id)}
                  className={`w-full py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                    isThisRunning
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isThisRunning ? 'RUNNING SCENARIO...' : 'SIMULATE ATTACK'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimulationCenter;
