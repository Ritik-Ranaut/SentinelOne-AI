import React, { useState } from 'react';
import { Settings as SettingsIcon, Cpu, Sliders, Shield, Save, Check } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Settings = () => {
  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('qwen3:8b');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [highThreshold, setHighThreshold] = useState(60);
  const [simSpeed, setSimSpeed] = useState(800);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('sentinel_ai_provider', provider);
    localStorage.setItem('sentinel_ai_model', model);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            <span>SOC & AI Platform Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tune multi-agent LLM providers, risk evaluation thresholds, and simulation telemetry cadence
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Platform configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Provider Configuration */}
        <GlassCard title="Multi-Agent LLM Engine Provider" icon={Cpu}>
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  provider === 'ollama' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="ollama"
                  checked={provider === 'ollama'}
                  onChange={() => setProvider('ollama')}
                  className="hidden"
                />
                <div className="font-bold text-sm text-cyan-400">Ollama (Local LLM)</div>
                <p className="text-[11px] text-slate-400 mt-1">Zero external data leakage. Connects to host Ollama instance.</p>
                <div className="text-[10px] text-emerald-400 mt-2">Active host model: qwen3:8b</div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  provider === 'external' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="external"
                  checked={provider === 'external'}
                  onChange={() => setProvider('external')}
                  className="hidden"
                />
                <div className="font-bold text-sm text-purple-400">External LLM API</div>
                <p className="text-[11px] text-slate-400 mt-1">OpenAI / Anthropic / Gemini compatible API via environment variables.</p>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  provider === 'fallback' ? 'border-cyan-500 bg-cyan-950/20 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="fallback"
                  checked={provider === 'fallback'}
                  onChange={() => setProvider('fallback')}
                  className="hidden"
                />
                <div className="font-bold text-sm text-amber-400">Rule-Based Fallback</div>
                <p className="text-[11px] text-slate-400 mt-1">Deterministic cybersecurity reasoning engine requiring no LLM service.</p>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Ollama Service Endpoint</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Model Name</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Risk Thresholds & Telemetry Cadence */}
        <GlassCard title="Risk Thresholds & Simulation Timing" icon={Sliders}>
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Critical Risk Cutoff (pts)</label>
                <input
                  type="number"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
                />
                <span className="text-[10px] text-slate-500">Scores &ge; this trigger Critical severity.</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">High Risk Cutoff (pts)</label>
                <input
                  type="number"
                  value={highThreshold}
                  onChange={(e) => setHighThreshold(Number(e.target.value))}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
                />
                <span className="text-[10px] text-slate-500">Scores &ge; this trigger High severity.</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Simulation Cadence (ms/event)</label>
                <input
                  type="number"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-lg p-2.5 text-white"
                />
                <span className="text-[10px] text-slate-500">Delay between emitted scenario events.</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors shadow-glow-cyan"
          >
            <Save className="w-4 h-4" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
