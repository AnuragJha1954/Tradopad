/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          page: "var(--bg-page)",
          sidebar: "var(--bg-sidebar)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          placeholder: "var(--text-placeholder)",
        },
        hover: {
          fill: "var(--hover-fill)",
        },
        divider: "var(--divider)",
        border: {
          token: "var(--divider)",
        },
        checkbox: {
          checked: "var(--checkbox-checked)",
        },
        link: {
          focus: "var(--link-focus)",
        },
        code: {
          bg: "var(--code-bg)",
          text: "var(--code-text)",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          '"Apple Color Emoji"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        popup: "0 0 0 1px rgba(15,15,15,0.05), 0 3px 6px rgba(15,15,15,0.1), 0 9px 24px rgba(15,15,15,0.2)",
      },
      maxWidth: {
        content: "708px",
      },
    },
  },
  plugins: [],
};
