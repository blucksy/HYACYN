/** @type {import('tailwindcss').Config} */

const tailwindConfig = {
  content: [
    "./assets/*.{liquid,js,json}",
    "./config/*.{liquid,js,json}",
    "./layout/*.{liquid,js,json}",
    "./sections/*.{liquid,js,json}",
    "./snippets/*.{liquid,js,json}",
    "./templates/**/*.{liquid,js,json}",
  ],
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [require("@tailwindcss/aspect-ratio"), require("tailwind-children")],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        twingreen: "#002500",
      },
    },
  },
};

if (process.env.NODE_ENV !== "production") {
  // tailwindConfig.safelist.push({
  //   pattern: /./,
  // })
}

module.exports = tailwindConfig;
