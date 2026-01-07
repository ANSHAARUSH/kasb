/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      colors: {
        // Custom minimal palette if needed, otherwise using standard Tailwind colors
        'soft-black': '#0a0a0a',
        'off-white': '#f8f9fa',
      }
    },
  },
  plugins: [],
}
