import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-thai)', 'system-ui', 'sans-serif'],
        thai: ['var(--font-thai)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      colors: {
        slate: {
          850: '#141d2e',
          900: '#0f172a',
          925: '#0a0f1d',
          950: '#060913'
        },
        bkk: {
          gold: '#f59e0b',
          emerald: '#10b981',
          river: '#38bdf8',
          dark: '#080c14'
        }
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-emerald-lg': '0 0 40px -10px rgba(16, 185, 129, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-subtle': '0 4px 20px 0 rgba(0, 0, 0, 0.25)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
export default config;

