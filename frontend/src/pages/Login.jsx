import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="soc-grid min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="max-w-md w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 items-center justify-center shadow-glow-cyan">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wider">
            SENTINEL <span className="text-cyan-400">AI</span>
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Security Operations Center (SOC) Console
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-[#0b1120]/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin or analyst"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#05080f] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-glow-cyan flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE TO CONSOLE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">
              Quick 1-Click Demo Profiles
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'SentinelAdmin123!')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 border border-slate-700 text-center"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst', 'SentinelAdmin123!')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-purple-300 border border-slate-700 text-center"
              >
                ANALYST
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer', 'SentinelAdmin123!')}
                className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-emerald-300 border border-slate-700 text-center"
              >
                VIEWER
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link to="/register" className="text-xs font-mono text-cyan-400 hover:underline">
              Don't have an analyst account? Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
