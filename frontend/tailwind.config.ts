import type { Config } from "tailwindcss"

export default {
  darkMode: ["selector", '[data-theme="night"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 2px)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
      },
      transitionTimingFunction: {
        fb: "cubic-bezier(0.2, 0.6, 0.2, 1)",
      },
      colors: {
        /* shadcn semantic names, repointed onto the Fieldbook palette */
        background: "var(--paper)",
        foreground: "var(--ink)",
        card: {
          DEFAULT: "var(--paper-2)",
          foreground: "var(--ink)",
        },
        popover: {
          DEFAULT: "var(--paper-3)",
          foreground: "var(--ink)",
        },
        primary: {
          DEFAULT: "var(--ink)",
          foreground: "var(--paper)",
        },
        secondary: {
          DEFAULT: "var(--paper-3)",
          foreground: "var(--ink)",
        },
        muted: {
          DEFAULT: "var(--paper-2)",
          foreground: "var(--ink-2)",
        },
        accent: {
          DEFAULT: "var(--paper-3)",
          foreground: "var(--ink)",
        },
        destructive: {
          DEFAULT: "var(--redline)",
          foreground: "var(--paper)",
        },
        border: "var(--rule)",
        input: "var(--rule)",
        ring: "var(--focus)",

        /* Fieldbook tokens, named directly */
        paper: {
          DEFAULT: "var(--paper)",
          2: "var(--paper-2)",
          3: "var(--paper-3)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        rule: {
          DEFAULT: "var(--rule)",
          strong: "var(--rule-strong)",
        },
        redline: {
          DEFAULT: "var(--redline)",
          weak: "var(--redline-weak)",
        },
        strat: {
          aggressive: "var(--strat-aggressive)",
          moderate: "var(--strat-moderate)",
          patient: "var(--strat-patient)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        crit: "var(--crit)",
        info: "var(--info)",
        focus: "var(--focus)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
