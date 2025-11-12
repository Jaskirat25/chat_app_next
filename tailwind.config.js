/** @type {import('tailwindcss').Config} */
export default {
  content: [
     "./app/**/*.{js,ts,jsx,tsx}",   // App router
    "./pages/**/*.{js,ts,jsx,tsx}", // Pages router
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
