/* global __dirname */

const path = require("path");

const webpack = require("webpack");
const BundleAnalyzer = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const dirSrc = path.resolve(__dirname, "src");
const dirTest = path.resolve(__dirname, "test");
const public = path.resolve(__dirname, "public");
const dirBuild = path.resolve(__dirname, "flappy");
const dirDist = path.resolve(__dirname, "dist");
const dirDev = path.resolve(__dirname, "dev");

const args = process.argv.slice(2);

let entry;
let output;
let devtool;
let plugins;

entry = {
  slides: "./src/index.js",
  game: "./src/game.js"
};
output = {
  path: dirBuild,
  filename: "[name].js"
};
plugins = [
  // Avoid publishing files when compilation fails
  new webpack.NoEmitOnErrorsPlugin()
];
// Create Sourcemaps for the bundle
devtool = "source-map";

module.exports = {
  mode: "production",
  entry,
  output,
  plugins,
  devtool,
  devServer: {
    compress: true,
    contentBase: public,
    historyApiFallback: true
  },
  module: {
    rules: []
  },
  stats: {
    // Nice colored output
    colors: true
  }
};
