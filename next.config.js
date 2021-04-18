/* eslint-disable */
const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
})

module.exports = withMDX({
  pageExtensions: ["tsx", "mdx"],
})
