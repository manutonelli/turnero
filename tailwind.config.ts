import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#589eff",
          500: "#3178ff",
          600: "#1a58f5",
          700: "#1544e0",
          800: "#1838b5",
          900: "#19348f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
