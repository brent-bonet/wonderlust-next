import type { Config } from "tailwindcss";

/**
 * Design tokens extracted verbatim from reference/index.html `:root` —
 * that file is the design spec; do not adjust these values.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#243029", // storefront trim green, deepened (sampled ~#304030)
        paper: "#f6f8f6",
        toner: "#14c4cb", // window-lettering turquoise (sampled)
        "toner-deep": "#0c8289", // same hue, dark enough for text/links
        fog: "#cfe0dd",
        tan: "#a9783f", // the oak door
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        typed: ["var(--font-typed)", "Courier New", "monospace"],
        body: ["var(--font-body)", "-apple-system", "Helvetica Neue", "sans-serif"],
        mono: ["var(--font-mono)", "SF Mono", "monospace"],
      },
      maxWidth: {
        wrap: "1120px", // --max
      },
    },
  },
};

export default config;
