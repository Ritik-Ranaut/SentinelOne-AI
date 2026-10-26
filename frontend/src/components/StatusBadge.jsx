import React from 'react';
import { SEVERITY_COLORS, STATUS_COLORS } from '../utils/constants';

export const SeverityBadge = ({ severity = 'NORMAL', pulse = false }) => {
  const sevKey = (severity || 'NORMAL').toUpperCase();
  const config = SEVERITY_COLORS[sevKey] || SEVERITY_COLORS.NORMAL;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? 'animate-ping' : ''}`} />
      <span>{sevKey}</span>
    </span>
  );
};

export const StatusPill = ({ status = 'NEW' }) => {
  const statKey = (status || 'NEW').toUpperCase();
  const colorClass = STATUS_COLORS[statKey] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold border ${colorClass}`}>
      {statKey.replace('_', ' ')}
    </span>
  );
};

export default { SeverityBadge, StatusPill };
