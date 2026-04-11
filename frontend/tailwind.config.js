/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Shared surface tokens ──────────────────────────────── */
        "surface-tint":                "#c0c1ff",
        "surface-container-lowest":    "#0d0e10",
        "surface-container-low":       "#1b1c1e",
        "surface-container":           "#1f2022",
        "surface-container-high":      "#292a2c",
        "surface-container-highest":   "#343537",
        "surface-bright":              "#38393b",
        "surface-variant":             "#343537",
        "surface-dim":                 "#121315",
        "surface":                     "#121315",
        "background":                  "#0A0A0B",
        "outline":                     "#908fa0",
        "outline-variant":             "#464554",

        /* ── On-surface tokens ──────────────────────────────────── */
        "on-surface":                  "#e3e2e5",
        "on-surface-variant":          "#c7c4d7",
        "on-background":               "#e3e2e5",
        "inverse-surface":             "#e3e2e5",
        "inverse-on-surface":          "#303033",

        /* ── Primary ────────────────────────────────────────────── */
        "primary":                     "#6366F1",
        "primary-fixed":               "#e1e0ff",
        "primary-fixed-dim":           "#c0c1ff",
        "primary-container":           "#4f46e5",
        "on-primary":                  "#ffffff",
        "on-primary-fixed":            "#07006c",
        "on-primary-fixed-variant":    "#2f2ebe",
        "on-primary-container":        "#ffffff",
        "inverse-primary":             "#494bd6",

        /* ── Secondary ──────────────────────────────────────────── */
        "secondary":                   "#bdc2ff",
        "secondary-fixed":             "#e0e0ff",
        "secondary-fixed-dim":         "#bdc2ff",
        "secondary-container":         "#2f3aa3",
        "on-secondary":                "#131e8c",
        "on-secondary-fixed":          "#000767",
        "on-secondary-fixed-variant":  "#2f3aa3",
        "on-secondary-container":      "#a8afff",

        /* ── Tertiary ───────────────────────────────────────────── */
        "tertiary":                    "#ddb8ff",
        "tertiary-fixed":              "#f0dbff",
        "tertiary-fixed-dim":          "#ddb8ff",
        "tertiary-container":          "#b175ec",
        "on-tertiary":                 "#490081",
        "on-tertiary-fixed":           "#2c0051",
        "on-tertiary-fixed-variant":   "#62259b",
        "on-tertiary-container":       "#400071",

        /* ── Error ──────────────────────────────────────────────── */
        "error":                       "#ffb4ab",
        "error-container":             "#93000a",
        "on-error":                    "#690005",
        "on-error-container":          "#ffdad6",

        /* ── Brand accent (plan page) ───────────────────────────── */
        "brand-purple":                "#6366F1",
      },
      fontFamily: {
        headline: ["Manrope",  "sans-serif"],
        body:     ["Inter",    "sans-serif"],
        label:    ["Inter",    "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        "2xl":   "1rem",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};
