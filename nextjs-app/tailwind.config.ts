import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'indigo': {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      fontSize: {
        'h1': ['2.5rem', '1.2'],
        'h2': ['1.75rem', '1.3'],
        'h3': ['1.25rem', '1.4'],
        'body': ['1rem', '1.5'],
        'sm': ['0.875rem', '1.5'],
      },
      screens: {
        '2xl': '2560px',
        'xl': '1920px',
        'lg': '1440px',
        'md': '1280px',
        'sm': '1024px',
        'xs': '768px',
        'sm-mobile': '640px',
        'xs-mobile': '480px',
      },
    },
  },
  plugins: [],
}
export default config
