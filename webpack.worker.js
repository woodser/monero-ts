"use strict"

const path = require("path");
const configBase = require("./webpack.base.js");

let configMoneroWebWorker = Object.assign({}, configBase, {
  name: "Monero web worker config",
  entry: "./src/main/ts/common/MoneroWebWorker.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "monero.worker.js"
  },
});

module.exports = configMoneroWebWorker;