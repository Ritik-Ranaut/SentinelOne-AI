import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  AlertOctagon,
  ShieldAlert,
  Globe,
  Users,
  HardDrive,
  Bot,
  PlaySquare,
  FileText,
  ShieldCheck,
  MessageSquareCode,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live-events', label: 'Live Events', icon: Terminal },
  { path: '/incidents', label: 'Incidents', icon: AlertOctagon },
  { path: '/threats', label: 'Threat Intel', icon: ShieldAlert },
  { path: '/threat-map', label: 'Threat Map', icon: Globe },
  { path: '/simulations', label: 'Simulations', icon: PlaySquare },
  { path: '/agents', label: 'Agents Center', icon: Bot },
  { path: '/chat', label: 'SOC AI Copilot', icon: MessageSquareCode },
  { path: '/users', label: 'Users Directory', icon: Users },
  { path: '/devices', label: 'Device Inventory', icon: HardDrive },
  { path: '/reports', label: 'Incident Reports', icon: FileText },
  { path: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  { path: '/settings', label: 'Settings', icon: Settings }
];

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-4rem)] bg-[#0d1316] border-r border-slate-700 transition-all duration-200 flex-col justify-between ${
        collapsed && !mobileOpen ? 'md:w-16' : 'md:w-64'
      } ${mobileOpen ? 'fixed left-0 top-16 z-50 flex w-64' : 'hidden md:sticky md:top-16 md:flex'}`}
    >
      <div className="py-4 px-2 overflow-y-auto overflow-x-hidden space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${collapsed && !mobileOpen ? 'justify-center' : ''}`
              }
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors group-hover:text-cyan-400`} />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="hidden md:flex p-3 border-t border-slate-800/80 justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full py-1.5 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <span className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
