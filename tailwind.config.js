/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#1e1e1e',
        'sidebar-bg': '#252526',
        'content-bg': '#2d2d2d',
        'border': '#3c3c3c',
        'text-primary': '#cccccc',
        'text-secondary': '#858585',
        'accent': '#0078d4',
        'hover': '#2a2d2e'
      }
    }
  },
  plugins: []
}
