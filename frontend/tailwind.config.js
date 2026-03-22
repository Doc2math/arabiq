/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:         '#C9953A',
          'gold-light': '#E8B86D',
          'gold-dark':  '#8A6320',
          teal:         '#1A6B6B',
          'teal-light': '#2D9E9E',
          'teal-dark':  '#0D4040',
        },
        surface: {
          DEFAULT:          '#FAFAF7',
          secondary:        '#F2F1EC',
          dark:             '#111210',
          'dark-secondary': '#1C1C1A',
        },
      },
      fontFamily: {
        sans:    ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        arabic:  ['Noto Naskh Arabic', 'Scheherazade New', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

