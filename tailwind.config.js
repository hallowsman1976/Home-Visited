/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Noto Sans Thai', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' },
      },
      boxShadow: { soft: '0 14px 40px rgba(15, 118, 110, 0.10)' },
    },
  },
  plugins: [],
};

