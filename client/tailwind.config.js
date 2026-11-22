/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#2D5A43',
          800: '#1B4332',
          900: '#0F291E',
          950: '#081c15',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EDE7DB',
          300: '#DFD5C2',
          400: '#D4A373',
          500: '#B88252',
          600: '#99673C',
          700: '#7A4D2A',
          800: '#5C381E',
          900: '#3D2413',
        },
        cream: '#FDFBF7',
        parchment: '#F9F6F0',
        amberGold: '#C59B27',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'book': '0 10px 25px -5px rgba(27, 67, 50, 0.15), 0 8px 10px -6px rgba(27, 67, 50, 0.1)',
        'book-lg': '0 20px 30px -10px rgba(27, 67, 50, 0.25), 0 10px 15px -5px rgba(27, 67, 50, 0.15)',
        'elevated': '0 4px 20px -2px rgba(45, 90, 67, 0.08)',
      }
    },
  },
  plugins: [],
}
