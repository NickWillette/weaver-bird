import type { Preview } from "@storybook/react";
import "../src/app.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: "fullscreen",
    backgrounds: {
      default: "parchment",
      values: [
        { name: "parchment", value: "var(--color-bg)" },
        { name: "slate", value: "#2b2437" },
      ],
    },
  },
};

export default preview;
