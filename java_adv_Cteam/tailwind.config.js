/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4B5563',
        'secondary': '#6B7280',
      },
      borderRadius: {
        '2xl': '2rem',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(to bottom, #EFF6FF, #DBEAFE)',
      }
    },
  },
  plugins: [],
} 