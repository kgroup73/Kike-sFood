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
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Sistema de color de toda la app. Los valores viven en variables CSS
        // (src/index.css) para el modo oscuro de la carta y el acento de cada restaurante.
        mantel: 'rgb(var(--c-mantel) / <alpha-value>)',
        plato: 'rgb(var(--c-plato) / <alpha-value>)',
        tinta: 'rgb(var(--c-tinta) / <alpha-value>)',
        suave: 'rgb(var(--c-suave) / <alpha-value>)',
        linea: 'rgb(var(--c-linea) / <alpha-value>)',
        hoja: 'rgb(var(--c-hoja) / <alpha-value>)',
        'sobre-hoja': 'rgb(var(--c-sobre-hoja) / <alpha-value>)',
        aji: 'rgb(var(--c-aji) / <alpha-value>)',
        maracuya: 'rgb(var(--c-maracuya) / <alpha-value>)',
        acero: 'rgb(var(--c-acero) / <alpha-value>)',

        // --- Paleta heredada (rama feat/frontend-redesign / main) ---
        // Solo la usan TablesAdmin y TableStickersModal, que se conservan con su
        // mosaico de mesas y su hoja de stickers originales. Si esos módulos se
        // migran al sistema de color de arriba, esta sección se puede borrar.
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
          muted: '#857f5d',
          night: '#14120c',
          panel: '#1e1b13',
          line: '#383324',
          raised: '#2c271d',
          hover: '#242017',
          mute: '#aba489'
        },
        orange: {
          50: '#fdfcf7',
          100: '#f7f4ed',
          200: '#e9e2ca',
          300: '#e7e1c9',
          400: '#b8960e',
          500: '#9b7e09',
          600: '#857f5d',
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
          950: '#110f0a',
          900: '#1a1711',
          800: '#2c271d',
          700: '#423b2d',
          600: '#5e5541',
          500: '#857f5d',
          400: '#aba489',
          300: '#d7d0b8',
          200: '#e7e1c9',
          100: '#e9e2ca',
          50: '#fdfcf7'
        }
      }
    },
  },
  plugins: [],
}
