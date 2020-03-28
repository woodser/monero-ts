"use strict"

const path = require("path");
const configBase = require("./webpack.base.js");

let configMoneroWebWorker = Object.assign({}, configBase, {
  name: "Monero web worker config",
  entry: "./src/main/js/utils/MoneroWebWorker.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "MoneroWebWorker.dist.js"
  },
});

module.exports = configMoneroWebWorker;