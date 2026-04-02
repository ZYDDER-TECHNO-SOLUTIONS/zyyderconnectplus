/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05)',
        'card-hover': '0 4px 24px rgba(0,0,0,.10)',
      },
      animation: {
        'fade-in': 'fadeIn .5s ease forwards',
        'fade-in-up': 'fadeInUp .6s ease forwards',
        'slide-up': 'slideUp .35s ease',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'count-up': 'countPop .6s ease forwards',
        'checkmark': 'checkmark .5s ease forwards',
        'scale-in': 'scaleIn .3s ease forwards',
        'border-pulse': 'borderPulse 1.5s ease infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeInUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        gradientShift: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        countPop: { '0%': { transform: 'scale(0.5)', opacity: 0 }, '70%': { transform: 'scale(1.1)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        checkmark: { '0%': { transform: 'scale(0) rotate(-45deg)', opacity: 0 }, '50%': { transform: 'scale(1.2) rotate(0deg)' }, '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        borderPulse: { '0%, 100%': { borderColor: 'rgb(199 210 254)' }, '50%': { borderColor: 'rgb(99 102 241)' } },
      },
    },
  },
  plugins: [],
}
