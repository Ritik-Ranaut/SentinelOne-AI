import React, { useState, useEffect } from 'react';
import { Globe, ShieldAlert, Activity, MapPin, Radio } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/GlassCard';
import { SeverityBadge } from '../components/StatusBadge';

const HOTSPOTS = [
  { name: 'Frankfurt, DE', lat: 50.1109, lon: 8.6821, x: 530, y: 160, ip: '185.220.101.42', threat: 'Brute Force Spray', severity: 'CRITICAL', count: 184 },
  { name: 'Bucharest, RO', lat: 44.4268, lon: 26.1025, x: 560, y: 180, ip: '45.154.255.89', threat: 'Residential Proxy Probe', severity: 'HIGH', count: 92 },
  { name: 'Tokyo, JP', lat: 35.6762, lon: 139.6503, x: 810, y: 220, ip: '133.242.18.99', threat: 'Impossible Travel Jump', severity: 'HIGH', count: 64 },
  { name: 'Amsterdam, NL', lat: 52.3676, lon: 4.9041, x: 520, y: 155, ip: '198.51.100.188', threat: 'API Fuzzing Bot', severity: 'HIGH', count: 112 },
  { name: 'Saint Petersburg, RU', lat: 59.9311, lon: 30.3609, x: 585, y: 130, ip: '172.16.50.200', threat: 'Port Scan Sweep', severity: 'CRITICAL', count: 215 },
  { name: 'San Francisco, US', lat: 37.7749, lon: -122.4194, x: 210, y: 210, ip: '10.10.1.15', threat: 'Corporate HQ Ingress', severity: 'NORMAL', count: 480 },
  { name: 'Singapore, SG', lat: 1.3521, lon: 103.8198, x: 740, y: 310, ip: '103.208.220.14', threat: 'Credential Stuffing', severity: 'MEDIUM', count: 47 }
];

const ThreatMap = () => {
  const [selectedHotspot, setSelectedHotspot] = useState(HOTSPOTS[0]);
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await api.get('/threats');
        if (res.data.success) {
          setThreats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load threats:', err);
      }
    };
    fetchThreats();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center space-x-3">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>Global Threat Telemetry Map</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Simulated geographical attack origin tracking • Edge perimeter ingress hotspots
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs font-mono text-cyan-400">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>SIMULATED GEO-TELEMETRY</span>
        </div>
      </div>

      {/* Main SVG Interactive Map Visualizer */}
      <GlassCard className="!p-0 overflow-hidden relative border-cyan-500/30">
        <div className="relative w-full h-[520px] bg-[#05080f] flex items-center justify-center overflow-hidden">
          {/* World Map SVG background outline */}
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full opacity-40 select-none pointer-events-none"
          >
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#05080f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1000" height="500" fill="url(#mapGlow)" />
            {/* Simplified World Continents Paths */}
            <path
              d="M150,120 Q180,100 240,110 T320,160 T250,260 T180,240 Z M220,290 Q270,300 290,360 T250,460 T200,380 Z M460,110 Q540,80 600,120 T580,200 T480,180 Z M480,210 Q560,220 580,310 T520,440 T440,300 Z M640,100 Q800,80 880,140 T840,240 T660,200 Z M760,330 Q840,320 860,390 T790,430 T730,370 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />
          </svg>

          {/* Render Attack Vector Lines connecting to HQ (San Francisco x:210, y:210) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500">
            {HOTSPOTS.filter(h => h.name !== 'San Francisco, US').map((h, i) => (
              <g key={i}>
                <path
                  d={`M${h.x},${h.y} Q${(h.x + 210) / 2},${(h.y + 210) / 2 - 40} 210,210`}
                  fill="none"
                  stroke={h.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.6"
                  className="animate-pulse"
                />
              </g>
            ))}
          </svg>

          {/* Hotspot Markers */}
          {HOTSPOTS.map((spot, idx) => {
            const isSelected = selectedHotspot?.name === spot.name;
            const isHQ = spot.name.includes('San Francisco');

            return (
              <div
                key={idx}
                onClick={() => setSelectedHotspot(spot)}
                style={{
                  position: 'absolute',
                  left: `${(spot.x / 1000) * 100}%`,
                  top: `${(spot.y / 500) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="cursor-pointer group z-20"
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75 ${
                      isHQ ? 'bg-cyan-400' : spot.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-orange-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-slate-900 ${
                      isHQ ? 'bg-cyan-400' : spot.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                  />
                </div>
                <div
                  className={`mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-md whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 group-hover:border-slate-600'
                  }`}
                >
                  {spot.name.split(',')[0]}
                </div>
              </div>
            );
          })}

          {/* Selected Hotspot Float Info Box */}
          {selectedHotspot && (
            <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-[#0b1120]/95 border border-slate-800 backdrop-blur-md shadow-2xl font-mono text-xs max-w-xs space-y-2 z-30">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedHotspot.name}</span>
                </div>
                <SeverityBadge severity={selectedHotspot.severity} />
              </div>
              <div className="space-y-1 text-slate-300 pt-1 border-t border-slate-800 text-[11px]">
                <div>IP Address: <strong className="text-cyan-400">{selectedHotspot.ip}</strong></div>
                <div>Observed Vector: <strong className="text-slate-200">{selectedHotspot.threat}</strong></div>
                <div>Telemetry Probes: <strong className="text-amber-400">{selectedHotspot.count}</strong> events</div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Hotspots Grid Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {HOTSPOTS.map((spot, i) => (
          <div
            key={i}
            onClick={() => setSelectedHotspot(spot)}
            className={`p-4 rounded-xl bg-slate-900/40 border cursor-pointer transition-all ${
              selectedHotspot?.name === spot.name
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white font-mono">{spot.name}</span>
              <SeverityBadge severity={spot.severity} />
            </div>
            <div className="text-xs font-mono text-cyan-400 mt-2">{spot.ip}</div>
            <div className="text-[11px] text-slate-400 mt-1">{spot.threat}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatMap;
