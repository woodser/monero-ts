"use strict"

const path = require('path')

module.exports = 
{
	devtool: "source-map",
	context: __dirname,
	entry: "./src/main/index.js",
	output: {
		path: path.resolve(__dirname, "browser_build"),
		filename: "main/monero-javascript-bundle.js"
	},
	cache: false,
	resolve: {
		alias: {
			"fs": "html5-fs"
		},
		extensions: ['.js', '.jsx', '.css', '.json', 'otf', 'ttf', 'eot', 'svg'],
		modules: [
			'node_modules'
		]
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: path.join(__dirname, 'node_modules'),
				use: [
					{
						loader: 'babel-loader',
						options: {
							cacheDirectory: false
							// ,
							// presets: [ "es2015" ],
							// plugins: ["transform-runtime"]
						}
					}
				]
			}
		]
	}
}