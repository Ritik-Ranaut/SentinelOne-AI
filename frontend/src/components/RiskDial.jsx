import React from 'react';

const RiskDial = ({ score = 0, size = 'md' }) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  let color = '#10b981'; // Green (0-30)
  let label = 'LOW';
  let glow = 'rgba(16, 185, 129, 0.4)';

  if (clampedScore > 80) {
    color = '#ef4444'; // Red
    label = 'CRITICAL';
    glow = 'rgba(239, 68, 68, 0.5)';
  } else if (clampedScore > 60) {
    color = '#f97316'; // Orange
    label = 'HIGH';
    glow = 'rgba(249, 115, 22, 0.5)';
  } else if (clampedScore > 30) {
    color = '#f59e0b'; // Amber
    label = 'MEDIUM';
    glow = 'rgba(245, 158, 11, 0.4)';
  }

  const radius = size === 'lg' ? 48 : 32;
  const stroke = size === 'lg' ? 8 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex items-center space-x-3">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span
          className={`absolute font-mono font-bold text-white ${size === 'lg' ? 'text-xl' : 'text-sm'}`}
          style={{ textShadow: `0 0 10px ${glow}` }}
        >
          {clampedScore}
        </span>
      </div>
      <div>
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Risk Level</div>
        <div className="text-xs font-bold font-mono" style={{ color }}>
          {label}
        </div>
      </div>
    </div>
  );
};

export default RiskDial;
