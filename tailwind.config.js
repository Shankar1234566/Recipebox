/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF9F0',
        sage: '#66856A',
        forest: '#233427',
        charcoal: '#292D29',
        carrot: '#E89A55',
        mint: '#E6F0E5',
        stepgreen: '#4D9662'
      }
    },
  },
  plugins: [],
}
