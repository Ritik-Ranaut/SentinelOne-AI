/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#080c14',
          card: '#0f172a',
          cardBorder: '#1e293b',
          sidebar: '#0b1120',
          accent: '#06b6d4',      // cyan
          cyanGlow: '#00f2fe',
          danger: '#ef4444',      // red
          warning: '#f59e0b',     // yellow/amber
          high: '#f97316',        // orange
          success: '#10b981',     // emerald
          info: '#3b82f6',        // blue
          muted: '#64748b',
          highlight: '#38bdf8'
        }
      },
      fontFamily: {
        mono: ['Cascadia Code', 'Fira Code', 'JetBrains Mono', 'monospace', 'Courier New'],
        sans: ['Segoe UI Variable', 'Aptos', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-red': '0 0 20px -5px rgba(239, 68, 68, 0.4)',
        'glow-orange': '0 0 20px -5px rgba(249, 115, 22, 0.4)',
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
