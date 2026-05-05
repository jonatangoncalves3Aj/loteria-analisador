/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        gantt: {
          bar:       '#3b82f6',
          critical:  '#ef4444',
          milestone: '#8b5cf6',
          grid:      '#e2e8f0',
          today:     '#f59e0b',
        },
        forja: {
          bg:        '#0a0e27',
          surface:   '#12183a',
          primary:   '#a29bfe',
          secondary: '#48b8a6',
          accent:    '#fd79a8',
          text:      '#dfe6e9',
          muted:     '#636e72',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'breathe-in':  'breatheIn 4s ease-in-out forwards',
        'breathe-out': 'breatheOut 8s ease-in-out forwards',
        'hold':        'hold 7s linear forwards',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'emdr':        'emdrMove 2s ease-in-out infinite',
        'spin-slow':   'spin 20s linear infinite',
        'fadeIn':      'fadeIn 1s ease-in forwards',
      },
      keyframes: {
        breatheIn: {
          '0%':   { transform: 'scale(1)',    opacity: '0.5' },
          '100%': { transform: 'scale(1.6)', opacity: '1'   },
        },
        breatheOut: {
          '0%':   { transform: 'scale(1.6)', opacity: '1'   },
          '100%': { transform: 'scale(1)',    opacity: '0.5' },
        },
        hold: {
          '0%, 100%': { transform: 'scale(1.6)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px #a29bfe55' },
          '50%':      { boxShadow: '0 0 50px #a29bfe99' },
        },
        emdrMove: {
          '0%':   { transform: 'translateX(-140px)' },
          '50%':  { transform: 'translateX(140px)'  },
          '100%': { transform: 'translateX(-140px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
      },
    },
  },
  plugins: [],
}
