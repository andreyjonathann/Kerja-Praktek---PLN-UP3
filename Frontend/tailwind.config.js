/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map default blue to official PLN Mobile colors
        blue: {
          50:  '#e5f8fb',
          100: '#c2edf4',
          200: '#90ddec',
          300: '#5bcbe4',
          400: '#2ab4d4',
          500: '#00A2B9',
          600: '#00A2B9', // Light Teal (Primary Bright)
          700: '#035B71', // Dark Teal (Primary Dark/Hover)
          800: '#024d62',
          900: '#013e51',
        },
        // PLN Official Color Palette
        pln: {
          blue:      '#035B71',
          'blue-mid':'#00A2B9',
          'blue-lt': '#90ddec',
          red:       '#CC0000',
          yellow:    '#FFD700',
          gold:      '#F5A623',
        },
        // Semantic colors
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        success:  { DEFAULT: '#16A34A', light: '#DCFCE7', dark: '#14532D' },
        warning:  { DEFAULT: '#D97706', light: '#FEF3C7', dark: '#78350F' },
        danger:   { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#7F1D1D' },
        info:     { DEFAULT: '#0d9488', light: '#f0fdfa', dark: '#115e59' },
        // Dark mode surface colors
        surface: {
          DEFAULT:   '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary:  '#F1F5F9',
          dark:      '#0F172A',
          'dark-2':  '#1E293B',
          'dark-3':  '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md':'0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
        'card-lg':'0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)',
        'glow-blue': '0 0 20px rgba(13,148,136,0.3)',
        'glow-red':  '0 0 20px rgba(204,0,0,0.25)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-in':    'slideIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'count-up':    'countUp 1s ease-out',
        'skeleton':    'skeleton 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' },                         '100%': { opacity: '1' } },
        slideIn:  { '0%': { transform: 'translateX(-12px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        countUp:  { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        skeleton: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
