/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        safe:   { DEFAULT: '#16a34a', light: '#dcfce7' },
        warn:   { DEFAULT: '#ca8a04', light: '#fef9c3' },
        alert:  { DEFAULT: '#ea580c', light: '#ffedd5' },
        danger: { DEFAULT: '#dc2626', light: '#fee2e2' },
      },
    },
  },
  plugins: [],
}
