import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/sections/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#fef9f0',
          100: '#fdf2e0',
          200: '#fbe5c1',
          300: '#f8d19a',
          400: 'var(--logo-gold, #D4AF37)',
          500: 'var(--logo-gold, #D4AF37)',
          600: 'var(--logo-gold-dark, #B8941F)',
          700: 'var(--logo-gold-secondary, #C9A961)', 
          800: '#8b6f38',
          900: 'var(--logo-gold-tertiary, #8B6914)', 
        },
        dark: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#b3b3b3',
          300: '#808080',
          400: '#4d4d4d',
          500: '#2e2e2e',
          600: '#261E10', 
          700: '#1a1a1a',
          800: '#0D0D0D',
          900: '#000000',
          950: '#0D0D0D',
        },
        gold: {
          light: 'var(--logo-gold-light, #E6C866)',
          main: 'var(--logo-gold, #D4AF37)',
          aged: 'var(--logo-gold-secondary, #C9A961)',
          dark: 'var(--logo-gold-tertiary, #8B6914)',
        },
        brown: {
          dark: '#261E10',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
export default config 