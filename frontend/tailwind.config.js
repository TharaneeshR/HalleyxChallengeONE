/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b8fd',
          400: '#8193fb',
          500: '#6371f6',
          600: '#4f53ea',
          700: '#4141cf',
          800: '#3737a7',
          900: '#313183',
        },
        surface: {
          DEFAULT: '#0f1117',
          1: '#161b27',
          2: '#1e2535',
          3: '#252d42',
          4: '#2e3750',
        },
        accent: {
          green:  '#22c55e',
          yellow: '#eab308',
          red:    '#ef4444',
          blue:   '#3b82f6',
          purple: '#a855f7',
          cyan:   '#06b6d4',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}
