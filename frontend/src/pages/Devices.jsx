import React, { useState, useEffect } from 'react';
import { HardDrive, Search, ShieldAlert, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleIsolate = async (deviceId, currentStatus) => {
    setActionLoading(true);
    const action = currentStatus === 'ISOLATED' ? 'RESTORE' : 'ISOLATE';
    try {
      const res = await api.post(`/devices/${deviceId}/isolate`, { action });
      if (res.data.success) {
        fetchDevices();
      }
    } catch (err) {
      console.error('Failed to isolate device:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = devices.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.deviceId.toLowerCase().includes(s) ||
      d.user.toLowerCase().includes(s) ||
      d.ip.toLowerCase().includes(s) ||
      d.hostname.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <HardDrive className="w-6 h-6 text-cyan-400" />
            <span>Endpoint & Device Inventory</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Enterprise hardware assets • Anomaly flag indicators • Host isolation playbooks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDevices}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search device ID, hostname, IP, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Device Table */}
      <div className="bg-[#05080f] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#090d16] text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Device ID</th>
                <th className="py-3.5 px-4 font-semibold">Hostname</th>
                <th className="py-3.5 px-4 font-semibold">Assigned User</th>
                <th className="py-3.5 px-4 font-semibold">Operating System</th>
                <th className="py-3.5 px-4 font-semibold">IP Address</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Anomaly Flags</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Defense Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((dev) => (
                <tr key={dev._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">{dev.deviceId}</td>
                  <td className="py-3 px-4 font-medium text-white">{dev.hostname}</td>
                  <td className="py-3 px-4 text-slate-300">{dev.user}</td>
                  <td className="py-3 px-4 text-slate-400">{dev.os}</td>
                  <td className="py-3 px-4 text-slate-300">{dev.ip}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${dev.riskScore > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {dev.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {dev.anomalyIndicators && dev.anomalyIndicators.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] flex items-center space-x-1 w-max">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{dev.anomalyIndicators[0]}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dev.status === 'ISOLATED'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : dev.status === 'FLAGGED'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {dev.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleIsolate(dev.deviceId, dev.status)}
                      className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition-colors ${
                        dev.status === 'ISOLATED'
                          ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                          : 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-700/50'
                      }`}
                    >
                      {dev.status === 'ISOLATED' ? 'Restore Host' : 'Isolate Host'}
                    </button>
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

export default Devices;
