/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gantt: {
          bar: '#3b82f6',
          critical: '#ef4444',
          milestone: '#8b5cf6',
          grid: '#e2e8f0',
          today: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}

