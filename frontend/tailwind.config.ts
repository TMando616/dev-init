import type { Config } from "tailwindcss";

// Plugin registration lives in globals.css (`@plugin "@tailwindcss/typography";`).
// This config is loaded via `@config` solely to provide the `theme.extend.typography`
// CSS customization below (Tailwind v4 requires the JS API for that, see
// @tailwindcss/typography's README "Customizing the CSS" section).
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            "h1, h2": {
              borderBottom: `1px solid ${theme("colors.slate.200")}`,
              paddingBottom: theme("spacing.2"),
            },
            code: {
              backgroundColor: theme("colors.slate.100"),
              color: theme("colors.slate.800"),
              borderRadius: theme("borderRadius.md"),
              paddingInline: "0.4em",
              paddingBlock: "0.15em",
              fontWeight: "500",
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
            "pre code": {
              backgroundColor: "transparent",
              color: "inherit",
              padding: "0",
              fontWeight: "inherit",
            },
          },
        },
        invert: {
          css: {
            "h1, h2": {
              borderBottomColor: theme("colors.slate.700"),
            },
            code: {
              backgroundColor: theme("colors.slate.800"),
              color: theme("colors.slate.200"),
            },
          },
        },
      }),
    },
  },
};
export default config;
