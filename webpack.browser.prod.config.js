"use strict"

const merge = require('webpack-merge')
const common = require('./webpack.config.browser.common.js')
//
// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
//
module.exports = merge(common, {
	// plugins: [
	// 	new UglifyJSPlugin({
	// 		compress: {
	// 			drop_console: true,
	// 		}
	// 	})
	// ]
})