import React from 'react';
import { Shield, Activity, User, LogOut, AlertTriangle, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

const Navbar = ({ mobileNavOpen, onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isConnected, simulationStatus, latestIncident } = useSocket();

  return (
    <header className="h-16 border-b border-slate-700 bg-[#11191d] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Live Pulse */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-glow-cyan">
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">SENTINEL</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">SOC Platform</p>
          </div>
        </Link>

        {/* Real-time Socket Indicator */}
        <div className="hidden md:flex items-center space-x-2 pl-6 border-l border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {isConnected ? 'TELEMETRY LIVE' : 'CONNECTING...'}
          </span>
        </div>

        {/* Simulation Ticker Banner if running */}
        {simulationStatus.status === 'RUNNING' && (
          <Link
            to="/simulations"
            className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>SIMULATION ACTIVE: {simulationStatus.scenarioName} ({simulationStatus.currentStep}/{simulationStatus.totalSteps})</span>
          </Link>
        )}
      </div>

      {/* Right Controls: Incidents alert, User info, Logout */}
      <div className="flex items-center space-x-4">
        {latestIncident && (
          <Link
            to={`/incidents/${latestIncident.incidentId}`}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono hover:bg-red-500/25 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span className="hidden sm:inline">ALERT:</span>
            <span className="font-bold">{latestIncident.incidentId}</span>
            <span className="text-[10px] uppercase px-1 rounded bg-red-500/30 text-red-200">
              {latestIncident.severity}
            </span>
          </Link>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.fullName || user.username}</div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{user.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
