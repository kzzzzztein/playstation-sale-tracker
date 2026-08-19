import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Neutral zinc base + a single saturated accent (electric blue),
        // per the "one accent color" rule - no AI-purple gradients.
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          dim: "#1d4ed8",
        },
        surface: {
          DEFAULT: "#0a0a0d",
          raised: "#131317",
          border: "#232329",
        },
        discount: "#22c55e",
      },
      maxWidth: {
        "content-7xl": "1400px",
      },
    },
  },
  plugins: [],
} satisfies Config;
