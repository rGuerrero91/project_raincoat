import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Apple/Cladwell inspired color palette
        primary: {
          DEFAULT: "#0071e3", // Apple blue
          dark: "#0077ed",
          light: "#0071e31a",
          bg: "#f5f5f7", // Apple light gray
        },
        accent: {
          DEFAULT: "#0071e3",
          hover: "#0077ed",
          muted: "#6e6e73",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          light: "#424245",
        },
        neutral: {
          dark: "#1d1d1f",
          medium: "#6e6e73",
          light: "#f5f5f7",
          bg: "#ffffff",
        },
        // Legacy colors for backward compatibility
        "primary-blue": "#e3f2fd",
        "primary-green": "#e1f5e1",
        "primary-amber": "#fff3e0",
        "accent-info": "#0071e3",
        "accent-success": "#c8e6c9",
        "accent-warning": "#f57c00",
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "hero": ["clamp(42px, 8vw, 80px)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "headline": ["clamp(32px, 5vw, 56px)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "subhead": ["clamp(21px, 3vw, 28px)", { lineHeight: "1.4" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "full": "9999px",
      },
      boxShadow: {
        "soft": "0 2px 20px rgba(0, 0, 0, 0.08)",
        "medium": "0 4px 30px rgba(0, 0, 0, 0.12)",
        "large": "0 8px 40px rgba(0, 0, 0, 0.16)",
        "accent": "0 4px 12px rgba(0, 113, 227, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
