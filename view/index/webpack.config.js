const webpack = require('webpack')
const path = require('path')
const nodeModulesPath = "../../node_modules"

const config = {
  entry: ['./entry.js'],
  resolve: {
    extensions: ["", ".js"],
    node_modules: [nodeModulesPath]
  },
  devtool: 'source-map',
  output: {
    path: '.',
    filename: 'index.js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: [nodeModulesPath]
      }
    ]
  }
}

module.exports = config
