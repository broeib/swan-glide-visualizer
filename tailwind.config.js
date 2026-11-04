/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        swan: {
          dark: '#240A34',
          card: 'rgba(255, 255, 255, 0.45)',
          border: 'rgba(255, 255, 255, 0.6)',
        },
        ultraviolet: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
        }
      },
      boxShadow: {
        'glow-purple': '0 0 35px -5px rgba(168, 85, 247, 0.35)',
        'glow-pink': '0 0 35px -5px rgba(244, 63, 94, 0.35)',
        'device': '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
