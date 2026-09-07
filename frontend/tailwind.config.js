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
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        gov: {
          950: '#070B19',
          900: '#0B132B',
          850: '#111C3D',
          800: '#1C2541',
          750: '#223055',
          700: '#2D3E6B',
          600: '#3D548E',
          500: '#526EA8',
          400: '#7E95C5',
          300: '#A9BCE0',
        },
        legal: {
          compliant: '#10B981',
          warning: '#F59E0B',
          violation: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-glow': 'radial-gradient(at 10% 20%, rgba(6, 182, 212, 0.08) 0px, transparent 50%), radial-gradient(at 90% 80%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
};
