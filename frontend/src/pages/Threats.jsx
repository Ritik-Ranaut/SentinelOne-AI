import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Globe,
  Hash,
  Server,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Crosshair,
  ShieldCheck,
  Radio,
  Layers,
  Database
} from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { SeverityBadge } from '../components/StatusBadge';

const Threats = () => {
  const [activeTab, setActiveTab] = useState('indicators'); // 'indicators' | 'catalog'
  const [threats, setThreats] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for indicators
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reputationFilter, setReputationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // IOC Lookup Tool State
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [threatsRes, indicatorsRes] = await Promise.all([
        api.get('/threats'),
        api.get('/threats/indicators')
      ]);
      if (threatsRes.data.success) {
        setThreats(threatsRes.data.data);
      }
      if (indicatorsRes.data.success) {
        setIndicators(indicatorsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load threat intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!lookupInput.trim()) return;
    setLookupLoading(true);
    try {
      const res = await api.get(`/threats/lookup/${encodeURIComponent(lookupInput.trim())}`);
      if (res.data.success) {
        setLookupResult(res.data.data);
      }
    } catch (err) {
      console.error('IOC lookup failed:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  // Filtered Indicators
  const filteredIndicators = indicators.filter((ind) => {
    if (typeFilter !== 'ALL' && ind.type !== typeFilter) return false;
    if (reputationFilter !== 'ALL' && ind.reputation !== reputationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIndicator = ind.indicator?.toLowerCase().includes(q);
      const matchGroup = ind.threatGroup?.toLowerCase().includes(q);
      const matchThreats = ind.associatedThreats?.some((t) => t.toLowerCase().includes(q));
      if (!matchIndicator && !matchGroup && !matchThreats) return false;
    }
    return true;
  });

  const maliciousCount = indicators.filter((i) => i.reputation === 'MALICIOUS').length;
  const suspiciousCount = indicators.filter((i) => i.reputation === 'SUSPICIOUS').length;

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span>Threat Intelligence & IOC Center</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            MITRE ATT&CK threat taxonomy • Global indicator reputation feeds • Live IOC lookup analyzer
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SYNC FEEDS</span>
          </button>
        </div>
      </div>

      {/* Top Threat KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="!p-4 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Tracked Threat Vectors</span>
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{threats.length}</div>
          <p className="text-[11px] text-cyan-400 font-mono mt-1">Classified MITRE ATT&CK Tactics</p>
        </GlassCard>

        <GlassCard className="!p-4 border-red-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Malicious IOCs</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400 font-mono">{maliciousCount}</div>
          <p className="text-[11px] text-red-400 font-mono mt-1">Active Automated Drop Nodes</p>
        </GlassCard>

        <GlassCard className="!p-4 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Suspicious Indicators</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{suspiciousCount}</div>
          <p className="text-[11px] text-amber-400 font-mono mt-1">Under Active Observation</p>
        </GlassCard>

        <GlassCard className="!p-4 border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Intelligence Pool</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{indicators.length}</div>
          <p className="text-[11px] text-blue-400 font-mono mt-1">Correlated Telemetry Signatures</p>
        </GlassCard>
      </div>

      {/* Live IOC Lookup Tool */}
      <GlassCard title="Live Indicator of Compromise (IOC) Query Engine" icon={Crosshair} className="border-cyan-500/40">
        <div className="space-y-4">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Query IP address, domain name, or file hash (e.g. 185.220.101.42)..."
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !lookupInput.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-glow-cyan flex items-center justify-center space-x-2"
            >
              {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              <span>ANALYZE IOC</span>
            </button>
          </form>

          {lookupResult && (
            <div className="p-4 rounded-xl bg-[#05080f] border border-slate-800 space-y-3 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Target Indicator:</span>
                  <span className="font-bold text-cyan-400 text-sm">{lookupResult.indicator}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">{lookupResult.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      lookupResult.reputation === 'MALICIOUS'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : lookupResult.reputation === 'SUSPICIOUS'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {lookupResult.reputation} REPUTATION
                  </span>
                  <span className="text-slate-400">Confidence: {lookupResult.confidence}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500">Threat Actor / Group:</span>{' '}
                  <strong className="text-white">{lookupResult.threatGroup || 'Unclassified'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Associated Threats:</span>{' '}
                  <strong className="text-slate-200">
                    {lookupResult.associatedThreats?.join(', ') || 'General Ingress Anomaly'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Last Reported:</span>{' '}
                  <strong className="text-cyan-300">
                    {new Date(lookupResult.lastReported || Date.now()).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab('indicators')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'indicators'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Threat Indicators (IOCs) [{indicators.length}]</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'catalog'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Threat Catalog & MITRE ATT&CK [{threats.length}]</span>
        </button>
      </div>

      {/* Tab Content 1: Threat Indicators Table */}
      {activeTab === 'indicators' && (
        <GlassCard className="!p-0 overflow-hidden border-slate-800">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search indicator, threat group, attack type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05080f] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#05080f] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Types</option>
                <option value="IP">IP Address</option>
                <option value="DOMAIN">Domain</option>
                <option value="HASH">File Hash</option>
              </select>

              <span className="text-slate-500 ml-2">Reputation:</span>
              <select
                value={reputationFilter}
                onChange={(e) => setReputationFilter(e.target.value)}
                className="bg-[#05080f] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Reputations</option>
                <option value="MALICIOUS">Malicious</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>

          {/* Indicators Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#05080f] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Indicator</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Reputation</th>
                  <th className="py-3 px-4 font-semibold">Confidence</th>
                  <th className="py-3 px-4 font-semibold">Threat Actor</th>
                  <th className="py-3 px-4 font-semibold">Associated Attacks</th>
                  <th className="py-3 px-4 font-semibold">Last Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredIndicators.map((ind) => (
                  <tr key={ind._id || ind.indicator} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400 font-mono">{ind.indicator}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {ind.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ind.reputation === 'MALICIOUS'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : ind.reputation === 'SUSPICIOUS'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ind.reputation}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              ind.confidence >= 80 ? 'bg-red-500' : ind.confidence >= 50 ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${ind.confidence}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">{ind.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{ind.threatGroup || 'Unspecified'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {ind.associatedThreats?.join(', ') || 'General Anomaly'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">
                      {new Date(ind.lastReported || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredIndicators.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                      No threat indicators matched the active search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Tab Content 2: Threat Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {threats.map((t) => (
            <GlassCard key={t._id || t.threatId} className="border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{t.name}</h3>
                  <span className="text-[10px] font-mono text-cyan-400">{t.category}</span>
                </div>
                <SeverityBadge severity={t.severity} />
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.description}</p>
              <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">MITRE Technique:</span>
                  <span className="text-cyan-300 font-bold">{t.mitreTechnique || 'T1078'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Scope:</span>
                  <span className="text-slate-200">{t.targetScope || 'Enterprise Perimeter'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Seen:</span>
                  <span className="text-slate-400">{new Date(t.lastSeen || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Threats;
