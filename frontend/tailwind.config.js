/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Primary Brand Blue
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Brand Emerald Green (Logo Checkmark)
          600: '#059669',
          700: '#047857',
        },
        gov: {
          950: '#0f172a', // Deep slate for dark contrasts when needed
          900: '#ffffff', // Cards become clean white
          850: '#f8fafc', // Light slate-50
          800: '#f1f5f9', // Slate-100
          750: '#e2e8f0', // Slate-200 border
          700: '#cbd5e1', // Slate-300
          600: '#94a3b8',
          500: '#64748b',
          400: '#475569',
          300: '#334155',
        },
        legal: {
          compliant: '#10B981',
          warning: '#F59E0B',
          violation: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow-cyan': '0 0 20px -3px rgba(2, 132, 199, 0.25)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.2)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'shutter': '0 0 0 4px #e0f2fe, 0 8px 20px -4px rgba(2, 132, 199, 0.4)',
      }
    },
  },
  plugins: [],
};
