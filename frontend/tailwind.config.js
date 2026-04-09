/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0b0f',
          2: '#111318',
          3: '#1a1d26',
          4: '#22263a',
        },
        border: { DEFAULT: '#2a2e42', 2: '#353a52' },
        accent: '#4f7fff',
        safe: '#22c97a',
        warn: '#f5a623',
        danger: '#ff4d4d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
