/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1a1c2a',
        },
      },
      animation: {
        'spin-reverse': 'spin-reverse 1s linear infinite',
      },
      screens: {
        '2xl': '1200px',
      },
    },
  },
  plugins: [],
}
