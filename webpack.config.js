/* global __dirname */

const path = require('path');

const webpack = require('webpack');

const dirSrc = path.resolve(__dirname, 'src');
const dirTest = path.resolve(__dirname, 'test');
const dirBuild = path.resolve(__dirname, 'web-bluetooth');
const dirDist = path.resolve(__dirname, 'dist');
const dirDev = path.resolve(__dirname, 'dev');

const args = process.argv.slice(2);

let entry;
let output;
let devtool;
let plugins;

entry = {
  slides: './src/index.js',
  game: './src/game.js'
};
output = {
  path: dirBuild,
  filename: '[name].js'
};
plugins = [
  // Avoid publishing files when compilation fails
  new webpack.NoEmitOnErrorsPlugin(),
];
// Create Sourcemaps for the bundle
devtool = 'source-map';

module.exports = {
  entry,
  output,
  plugins,
  devtool,
  devServer: {
    contentBase: dirBuild,
    historyApiFallback: true
  },
  module: {
    rules: [
      /*
      {
        use: 'babel-loader',
        test: dirSrc,
      },
      {
        use: 'babel-loader',
        test: dirTest,
      }
      */
    ],
  },
  stats: {
    // Nice colored output
    colors: true,
  },
};
