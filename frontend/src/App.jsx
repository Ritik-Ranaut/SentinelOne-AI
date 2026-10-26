import React, { Component, Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SOC console error boundary captured an unexpected render failure:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1013] text-slate-200 flex items-center justify-center p-8">
          <div className="max-w-md w-full border border-red-500/30 bg-[#111827] rounded-xl p-6 shadow-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.28em] text-red-400 mb-3">Console Error</p>
            <h1 className="text-2xl font-semibold text-white mb-2">The SOC console hit an unexpected error.</h1>
            <p className="text-sm text-slate-300 mb-5">
              A page component failed to render. Reload the console to restore the session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 font-medium transition-colors"
            >
              Reload console
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveEvents = lazy(() => import('./pages/LiveEvents'));
const Incidents = lazy(() => import('./pages/Incidents'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const SimulationCenter = lazy(() => import('./pages/SimulationCenter'));
const ThreatMap = lazy(() => import('./pages/ThreatMap'));
const Threats = lazy(() => import('./pages/Threats'));
const Users = lazy(() => import('./pages/Users'));
const Devices = lazy(() => import('./pages/Devices'));
const Agents = lazy(() => import('./pages/Agents'));
const ChatCopilot = lazy(() => import('./pages/ChatCopilot'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Reports = lazy(() => import('./pages/Reports'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#080c14] flex items-center justify-center font-mono text-xs text-cyan-400">
        INITIALIZING SENTINEL CONSOLE...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0b1013] flex flex-col font-sans">
      <Navbar mobileNavOpen={mobileNavOpen} onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex-1 flex">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/60 md:hidden"
          />
        )}
        <main className="min-w-0 flex-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
          <AppErrorBoundary>
            <Suspense
              fallback={
                <div role="status" className="min-h-screen bg-[#0b1013] p-8 font-mono text-sm text-slate-300">
                  Loading console...
                </div>
              }
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected SOC Console Routes */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/live-events" element={<LiveEvents />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/incidents/:id" element={<IncidentDetail />} />
                  <Route path="/simulations" element={<SimulationCenter />} />
                  <Route path="/threats" element={<Threats />} />
                  <Route path="/threat-map" element={<ThreatMap />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/chat" element={<ChatCopilot />} />
                  <Route path="/knowledge-base" element={<KnowledgeBase />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
