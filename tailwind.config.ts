import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom Todoist colors
        'todoist-red': '#e44332',
        'todoist-orange': '#fa9441',
        'todoist-yellow': '#fad000',
        'todoist-green': '#7ecc49',
        'todoist-blue': '#299fe6',
        'todoist-purple': '#a970ff',
        'todoist-pink': '#ff87d4',
      },
    },
  },
  plugins: [],
} satisfies Config;