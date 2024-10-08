"use strict"

const path = require("path");
const configBase = require("./webpack.base.js");

let configBrowserTest = Object.assign({}, configBase, {
  name: "Browser tests config",
  entry: "./dist/src/test/browser/tests.js",
  output: {
    path: path.resolve(__dirname, "browser_build"),
    filename: "monero.tests.js"
  },
});

module.exports = configBrowserTest;