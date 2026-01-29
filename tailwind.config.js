/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        panel2: 'var(--panel2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        grid: 'var(--grid)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        danger: 'var(--danger)'
      },
      boxShadow: {
        glow: '0 0 20px rgba(244, 255, 0, 0.18)',
        card: '0 12px 30px rgba(0, 0, 0, 0.35)'
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        mono: ['var(--font-mono)']
      }
    }
  },
  plugins: []
};
