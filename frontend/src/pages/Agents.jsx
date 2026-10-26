import React, { useState, useEffect } from 'react';
import {
  Bot,
  Activity,
  Layers,
  Search,
  Globe,
  Zap,
  FileText,
  Compass,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import GlassCard from '../components/GlassCard';

const AGENT_ICON_MAP = {
  'Planner Agent': Compass,
  'Log Analysis Agent': Layers,
  'Threat Detection Agent': Activity,
  'Investigation Agent': Search,
  'Threat Intelligence Agent': Globe,
  'Risk Analysis Agent': Zap,
  'Response Agent': Bot,
  'Report Agent': FileText
};

const Agents = () => {
  const { agentStatuses } = useSocket();
  const [agents, setAgents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentData = async () => {
    try {
      const [agRes, runsRes] = await Promise.all([
        api.get('/agents'),
        api.get('/agents/runs?limit=15')
      ]);

      if (agRes.data.success) setAgents(agRes.data.data);
      if (runsRes.data.success) setRuns(runsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>Autonomous Multi-Agent Control Center</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            LangGraph multi-agent execution status • Performance telemetry • Orchestration pipeline
          </p>
        </div>
        <button
          onClick={fetchAgentData}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Visual LangGraph Execution Flow Diagram */}
      <GlassCard
        title="LangGraph StateGraph Workflow Architecture"
        subtitle="Shared context propagation across autonomous specialized agents"
        icon={Activity}
      >
        <div className="p-4 bg-[#05080f] rounded-xl border border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[900px] space-x-2 text-xs font-mono">
            {/* Step 1: Planner */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-center space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">1. Orchestrate</span>
              <div className="font-bold text-white">Planner</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 2: Log Analysis */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-center space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">2. Normalize</span>
              <div className="font-bold text-white">Log Analyst</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 3: Threat Detection */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-amber-500/40 text-center space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase">3. Classify</span>
              <div className="font-bold text-white">Threat Detect</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 4: Investigation */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-purple-500/40 text-center space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase">4. Correlate</span>
              <div className="font-bold text-white">Investigator</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 5: Threat Intel */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-blue-500/40 text-center space-y-1">
              <span className="text-[10px] text-blue-400 font-bold uppercase">5. Enrich</span>
              <div className="font-bold text-white">Threat Intel</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 6: Risk Analysis */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-red-500/40 text-center space-y-1">
              <span className="text-[10px] text-red-400 font-bold uppercase">6. Score Math</span>
              <div className="font-bold text-white">Risk Scorer</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 7: Response */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-emerald-500/40 text-center space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">7. Playbook</span>
              <div className="font-bold text-white">Response</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

            {/* Step 8: Report */}
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-center space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">8. Document</span>
              <div className="font-bold text-white">Reporter</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 8 Agent Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, i) => {
          const Icon = AGENT_ICON_MAP[agent.name] || Bot;
          const liveState = agentStatuses[agent.name]?.status || agent.status;

          return (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3 font-mono text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white text-xs">{agent.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    liveState === 'RUNNING'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                      : liveState === 'WAITING_APPROVAL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {liveState}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                  Task: <span className="text-slate-200">{agent.currentTask}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-cyan-400 font-bold">{agent.avgExecutionTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="text-emerald-400 font-bold">{agent.successRate}</span>
                </div>
                <div className="flex justify-between truncate">
                  <span>Last Result:</span>
                  <span className="text-slate-300 truncate max-w-[120px]">{agent.lastResult}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Runs History */}
      <GlassCard title="Recent Agent Execution Telemetry" icon={Clock}>
        <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
          {runs.map((r) => (
            <div
              key={r._id}
              className="flex items-center justify-between p-2.5 rounded bg-slate-900/40 border border-slate-800/60"
            >
              <div className="flex items-center space-x-3">
                <span className="text-slate-500 text-[10px]">
                  {new Date(r.startedAt).toLocaleTimeString()}
                </span>
                <span className="font-bold text-cyan-400">{r.agentName}</span>
                <span className="text-slate-300 font-medium">for #{r.incidentId}</span>
                <span className="text-slate-400 hidden sm:inline">{r.currentTask}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] text-slate-400">{r.duration}ms</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default Agents;
