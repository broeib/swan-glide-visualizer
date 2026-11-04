/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swan: {
          dark: '#2D1B4E',
          card: 'rgba(255, 255, 255, 0.45)',
          border: 'rgba(255, 255, 255, 0.6)',
        }
      }
    },
  },
  plugins: [],
}
