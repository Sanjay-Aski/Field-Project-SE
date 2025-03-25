/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9e7',
          100: '#fdf4cf',
          200: '#fce9a0',
          300: '#fbdf71',
          400: '#fad442',
          500: '#FAC738', // Your primary yellow color
          600: '#e1b333',
          700: '#c99c2d',
          800: '#b08527',
          900: '#976e21',
          950: '#7e5a1b',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        cream: '#FDFBF9', // Your cream color
        sand: '#F0E3C2', // Your background color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundColor: {
        page: '#F0E3C2', // Sand background
      }
    },
  },
  plugins: [],
}
