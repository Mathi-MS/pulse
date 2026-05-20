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
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          dark: '#4338CA'
        },
        darkbg: {
          950: '#030712', // super dark slate
          900: '#111827', // dark slate card background
          800: '#1F2937'  // lighter border background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        neon: '0 0 15px rgba(99, 102, 241, 0.4)'
      }
    },
  },
  plugins: [],
}
