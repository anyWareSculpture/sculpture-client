const { resolve } = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const production = process.env.NODE_ENV === 'production';

console.log(`Building for ${production ? 'production' : 'development'}`);

module.exports = {
  devtool: 'source-map',
  entry: {
    vendor: ['react', 'react-dom', 'lodash'],
    application: './app/src/index.js',
  },
  output: {
    path: resolve(__dirname, 'build'),
    publicPath: '/',
    filename: '[name].js',
  },
  resolve: {
    // Allowed implicit extensions for require/import
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
      minChunks: Infinity,
    }),
    new CopyWebpackPlugin([
      { context: 'node_modules/@anyware/sound-assets',
        from: '**/*.wav',
        to: 'sounds',
      },
      { context: 'static/app-icons',
        from: '*.png',
        to: 'images'
      },
      { context: 'static/images',
        from: '*.png',
        to: 'images'
      },
      { from: 'app/application.html' },
      { from: 'app/application.css' },
      { from: 'app/config.js' },
      { from: 'manifest.json' },
      { from: `scripts/background${production ? '-production' : ''}.js`,
        to: 'background.js' },
    ]),
  ],
  module: {
    rules: [
      { test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },

      // General purpose CSS loader, needed by e.g. react-bootstrap-table
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      // General purpose LESS loader, needed by e.g. bootstrap and our own less stylesheets
      { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },

      // The following 5 rules are needed by bootstrap
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: ['file-loader'] },
      { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, use: [{loader: 'url-loader', options: {limit: 10000, mimetype: 'application/font-woff'}}] },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, use: [{loader: 'url-loader', options: {limit: 10000, mimetype: 'application/octet-stream'}}] },
      { test: /\.svg$/, use: ['babel-loader', {loader: 'react-svg-loader', options: {jsx: true, svgo: {plugins: [{cleanupIDs: false}]}}}] },
    ]
  }
};
