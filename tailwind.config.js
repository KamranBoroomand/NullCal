/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f14',
        panel: 'rgba(16, 21, 29, 0.85)',
        panelBorder: 'rgba(255, 255, 255, 0.08)',
        accent: '#ff6b3d',
        accentSoft: '#ff8a63',
        card: '#f6f7fb'
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 107, 61, 0.12)',
        card: '0 8px 20px rgba(0, 0, 0, 0.35)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
