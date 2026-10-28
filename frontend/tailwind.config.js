/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          bg: 'var(--background)',
          text: 'var(--foreground)',
          primary: 'var(--primary)',
          'primary-fg': 'var(--primary-foreground)',
          accent: 'var(--accent)',
          'accent-fg': 'var(--accent-foreground)',
          success: 'var(--success)',
          warning: 'var(--warning)',
          destructive: 'var(--destructive)',
          muted: 'var(--muted)',
          'muted-fg': 'var(--muted-foreground)',
          border: 'var(--border)',
          card: 'var(--card)',
          info: 'var(--info)',
          navy: '#1e3a8a',
          gold: '#c5a028',
          slate: '#334155'
        }
      },
      fontFamily: {
        serif: ['Libre Baskerville', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Public Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'civic': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'civic-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.07)',
        'gazette': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
