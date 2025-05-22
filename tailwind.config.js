// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                 // Para o Vite, ele olha o index.html na raiz
    "./src/**/*.{js,ts,jsx,tsx}", // E todos os arquivos relevantes na pasta src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}