/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#174b42',
          foreground: '#ffffff',
        },
        background: '#f3f7fa',
        foreground: '#1d2b2a',
        muted: '#5b6b69',
        danger: '#b3261e',
      },
    },
  },
  plugins: [],
};
