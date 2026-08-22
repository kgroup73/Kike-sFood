/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          cream: '#e9e2ca',
          ivory: '#fdfcf7',
          sand: '#e7e1c9',
          khaki: '#857f5d',
          gold: '#9b7e09',
          'gold-light': '#b8960e',
          'gold-dark': '#7d6507',
          dark: '#110f0a',
          surface: '#1a1711',
          card: '#221e16',
          border: '#332d20',
          muted: '#857f5d'
        },
        // Mapeo armonizado con la paleta de marca Trattoria
        orange: {
          50: '#fdfcf7',
          100: '#f7f4ed',
          200: '#e9e2ca',
          300: '#e7e1c9',
          400: '#b8960e',
          500: '#9b7e09', // Oro Imperial Principal
          600: '#857f5d', // Khaki Oliva de Marca
          700: '#6e5a06',
          800: '#524305',
          900: '#2e281b',
          950: '#1a1711'
        },
        amber: {
          300: '#e9e2ca',
          400: '#b8960e',
          500: '#9b7e09',
          600: '#857f5d'
        },
        slate: {
          950: '#110f0a', // Fondo noche gourmet de lujo
          900: '#1a1711', // Superficie de tarjeta
          800: '#2c271d', // Bordes sutiles
          700: '#423b2d',
          600: '#5e5541',
          500: '#857f5d', // Khaki oliva
          400: '#aba489',
          300: '#d7d0b8',
          200: '#e7e1c9', // Arena suave
          100: '#e9e2ca', // Crema cálido
          50: '#fdfcf7'   // Marfil puro
        }
      }
    },
  },
  plugins: [],
}
