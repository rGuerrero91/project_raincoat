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
        // Design system colors from Demo_Design_Expectations.md
        primary: {
          green: "#e1f5e1",
          blue: "#e3f2fd",
          amber: "#fff3e0",
        },
        accent: {
          success: "#c8e6c9",
          warning: "#f57c00",
          info: "#1976d2",
        },
        neutral: {
          dark: "#212121",
          medium: "#757575",
          light: "#fafafa",
        },
      },
      spacing: {
        base: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
