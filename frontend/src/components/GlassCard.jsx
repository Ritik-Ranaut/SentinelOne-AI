import React from 'react';

const GlassCard = ({ children, title, subtitle, icon: Icon, badge, action, className = '' }) => {
  return (
    <section className={`glass-panel rounded-md p-5 relative ${className}`}>
      {(title || Icon || badge || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {badge && <span>{badge}</span>}
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
};

export default GlassCard;
