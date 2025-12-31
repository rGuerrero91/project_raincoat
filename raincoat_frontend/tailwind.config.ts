import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Muted pastel color palette
        primary: {
          DEFAULT: '#8bb8e8', // Muted pastel blue
          dark: '#6ba3d6',
          light: '#e8f0f8', // Very light pastel blue
          bg: '#f8f9fa', // Soft off-white
        },
        accent: {
          DEFAULT: '#8bb8e8',
          hover: '#6ba3d6',
          muted: '#9ca3af', // Muted gray
        },
        ink: {
          DEFAULT: '#374151', // Softer dark gray instead of pure black
          light: '#6b7280',
        },
        neutral: {
          dark: '#374151',
          medium: '#9ca3af',
          light: '#f3f4f6', // Soft gray
          bg: '#ffffff',
        },
        // Legacy colors for backward compatibility (muted versions)
        'primary-blue': '#e8f0f8',
        'primary-green': '#e8f4e8',
        'primary-amber': '#fef3e8',
        'accent-info': '#8bb8e8',
        'accent-success': '#c8e6c9',
        'accent-warning': '#f9b896', // Muted orange
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        hero: ['clamp(42px, 8vw, 80px)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        headline: ['clamp(32px, 5vw, 56px)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        subhead: ['clamp(21px, 3vw, 28px)', { lineHeight: '1.4' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 2px 20px rgba(0, 0, 0, 0.06)',
        medium: '0 4px 30px rgba(0, 0, 0, 0.08)',
        large: '0 8px 40px rgba(0, 0, 0, 0.12)',
        accent: '0 4px 12px rgba(139, 184, 232, 0.25)', // Muted blue shadow
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
export default config;
