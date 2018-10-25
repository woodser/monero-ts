"use strict"

const merge = require('webpack-merge')
const common = require('./webpack.config.browser.common.js')

module.exports = merge(common, {
	devtool: 'source-map', // "source-map"
	// devServer: {
	// 	contentBase: './browser_build'
	// }
})