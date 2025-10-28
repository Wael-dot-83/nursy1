export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Tajawal"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f8ff',
          100: '#dbeffc',
          200: '#baddf8',
          300: '#8ac3f2',
          400: '#5ba6e8',
          500: '#3c8fdc',
          600: '#2c70bd',
          700: '#24579a',
          800: '#21487d',
          900: '#203f68',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
