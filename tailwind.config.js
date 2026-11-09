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
      }
    },
  },
  plugins: [],
}
