import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        compass: {
          black: '#000000',
          white: '#FFFFFF',
          gray: '#E8E8E8',
          'gray-dark': '#6B6B6B',
          'gray-mid': '#A0A0A0',
        },
        brand: {
          navy: '#0A1628',
          'navy-dark': '#05101F',
          crimson: '#C41E3A',
          'crimson-dark': '#9A1730',
          cream: '#F7F3EE',
          sand: '#E8DFCE',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-1%, -1%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'ken-burns': 'ken-burns 12s ease-out forwards',
        'fade-in': 'fade-in 800ms ease-out forwards',
        'fade-in-up': 'fade-in-up 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slide-in-right 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        marquee: 'marquee 40s linear infinite',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
