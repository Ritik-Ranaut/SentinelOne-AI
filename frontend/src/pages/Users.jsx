import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, ShieldAlert, Key, UserCheck, RefreshCw } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import RiskDial from '../components/RiskDial';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.fullName?.toLowerCase().includes(s) ||
      u.department?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <UsersIcon className="w-6 h-6 text-cyan-400" />
            <span>Identity & Access Directory</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Enterprise user security profiles • Behavioral anomaly risk scoring • Access telemetry
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by username, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#05080f] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-[#090d16] text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Failed Logins</th>
                <th className="py-3.5 px-4 font-semibold">Enrolled Devices</th>
                <th className="py-3.5 px-4 font-semibold">Incidents</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{u.username}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{u.department || 'General'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${u.riskScore > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {u.riskScore}/100
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${u.failedLogins > 3 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                      {u.failedLogins}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {u.knownDevices?.length || 1} devices
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      u.incidentCount > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-500'
                    }`}>
                      {u.incidentCount || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {u.status}
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

export default Users;
