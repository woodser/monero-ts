"use strict"

const path = require("path");
const webpack = require('webpack')

let configBase = {
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: path.join(__dirname, 'node_modules'),
          type: "javascript/auto",
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false
              }
            }
          ]
        }
      ]
    },
    devtool: 'source-map',
    externals: ['worker_threads','ws','perf_hooks', 'child_process'], // exclude nodejs
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),
    ],
    resolve: {
      alias: {
        "fs": "html5-fs"
      },
      extensions: ['.js', '.jsx', '.css', '.json', 'otf', 'ttf', 'eot', 'svg'],
      modules: [
        'node_modules'
      ],
      fallback: { // browser polyfills
        assert: require.resolve('assert'),
        //buffer: require.resolve('buffer'),
        //console: require.resolve('console-browserify'),
        //constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        //domain: require.resolve('domain-browser'),
        //events: require.resolve('events'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        //punycode: require.resolve('punycode'),
        //process: require.resolve('process/browser'),
        querystring: require.resolve('querystring-es3'),
        stream: require.resolve('stream-browserify'),
        //string_decoder: require.resolve('string_decoder'),
        //sys: require.resolve('util'),
        //timers: require.resolve('timers-browserify'),
        //tty: require.resolve('tty-browserify'),
        url: require.resolve('url'),
        util: require.resolve('util'),
        //vm: require.resolve('vm-browserify'),
        zlib: require.resolve('browserify-zlib')
      }
    },
    cache: true,
    context: __dirname
};

module.exports = configBase;