export const SEVERITY_COLORS = {
  CRITICAL: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]'
  },
  HIGH: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]'
  },
  MEDIUM: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]'
  },
  LOW: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'
  },
  NORMAL: {
    bg: 'bg-slate-800/40',
    border: 'border-slate-700/40',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    glow: 'none'
  }
};

export const STATUS_COLORS = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INVESTIGATING: 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse',
  PENDING_APPROVAL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ACTION_TAKEN: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  RESOLVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FALSE_POSITIVE: 'bg-slate-700/30 text-slate-400 border-slate-600/30'
};

export const AGENT_ICONS = {
  'Planner Agent': 'Compass',
  'Log Analysis Agent': 'Layers',
  'Threat Detection Agent': 'ShieldAlert',
  'Investigation Agent': 'Search',
  'Threat Intelligence Agent': 'Globe',
  'Risk Analysis Agent': 'Activity',
  'Response Agent': 'Zap',
  'Report Agent': 'FileText'
};
