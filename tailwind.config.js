/** @type {import('tailwindcss').Config} */
// Walker design system — "Bright & Playful", ported from the Milo family app.
// All semantic colors are RGB triplets in globals.css so Tailwind opacity
// modifiers (e.g. bg-accent/10) keep working.
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Assistant covers both Hebrew and Latin cleanly (400–800).
        sans: ["Assistant", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        // ── Semantic tokens (defined in globals.css) ──
        bg:        "rgb(var(--bg) / <alpha-value>)",
        surface:   "rgb(var(--surface) / <alpha-value>)",
        surface2:  "rgb(var(--surface2) / <alpha-value>)",
        ink:       "rgb(var(--ink) / <alpha-value>)",        // primary text
        ink2:      "rgb(var(--ink2) / <alpha-value>)",       // secondary text
        accent:    "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)", // text on accent
        highlight:    "rgb(var(--highlight) / <alpha-value>)",
        "highlight-fg": "rgb(var(--highlight-fg) / <alpha-value>)",
        success:   "rgb(var(--success) / <alpha-value>)",
        danger:    "rgb(var(--danger) / <alpha-value>)",
        line:      "var(--line)",                             // hairline border

        // Dynamic person palette — assigned to family members by index.
        "pal-1": "rgb(var(--pal-1) / <alpha-value>)",
        "pal-2": "rgb(var(--pal-2) / <alpha-value>)",
        "pal-3": "rgb(var(--pal-3) / <alpha-value>)",
        "pal-4": "rgb(var(--pal-4) / <alpha-value>)",
        "pal-5": "rgb(var(--pal-5) / <alpha-value>)",
        "pal-6": "rgb(var(--pal-6) / <alpha-value>)",
        "pal-7": "rgb(var(--pal-7) / <alpha-value>)",
        "pal-8": "rgb(var(--pal-8) / <alpha-value>)",

        // Bento pastel surfaces (task-card tints)
        "c-yellow": "rgb(var(--c-yellow) / <alpha-value>)",
        "c-purple": "rgb(var(--c-purple) / <alpha-value>)",
        "c-blue":   "rgb(var(--c-blue) / <alpha-value>)",
        "c-pink":   "rgb(var(--c-pink) / <alpha-value>)",
        "c-mint":   "rgb(var(--c-mint) / <alpha-value>)",
        "c-peach":  "rgb(var(--c-peach) / <alpha-value>)",
      },
      fontSize: {
        // Type scale: 13.5 / 15 / 17 / 22 / 28 / 36.
        // letterSpacing normal — negative tracking cramps Hebrew.
        cap:     ["13.5px", { lineHeight: "19px" }],
        sub:     ["15px",   { lineHeight: "23px" }],
        body:    ["17px",   { lineHeight: "27px" }],
        h2:      ["22px",   { lineHeight: "30px", letterSpacing: "normal", fontWeight: "600" }],
        h1:      ["28px",   { lineHeight: "37px", letterSpacing: "normal", fontWeight: "700" }],
        display: ["36px",   { lineHeight: "44px", letterSpacing: "normal", fontWeight: "700" }],
      },
      borderRadius: {
        card: "28px",
        btn:  "18px",
        pill: "999px",
      },
      boxShadow: {
        card:  "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
      transitionTimingFunction: {
        out:    "cubic-bezier(0.23, 1, 0.32, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
