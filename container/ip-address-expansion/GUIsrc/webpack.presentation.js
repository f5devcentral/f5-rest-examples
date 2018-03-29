/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
*/

const webpack = require('webpack');
const path = require('path');

// Uses CssNext and PreCSS for styling in this project
const precss = require('precss');
const postcssImport = require('postcss-import');
const postcssCssNext = require('postcss-cssnext');
const postcssReporter = require('postcss-reporter');

// For Dev Server
const env = process.env.NODE_ENV;
const config = {
  target: 'web',
  stats: false,
  progress: true,

  entry: [
    './presentation/application.js',
  ],

  resolve: {
    extensions: ['', '.js', '.jsx'],
  },

  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader?modules&importLoaders=1!postcss-loader',
      },
    ],
  },

  output: {
    // path: path.join(__dirname, 'build', 'presentation'),
    path: '../presentation',
    filename: 'bundle.js'
  },

  postcss: () => [
    precss,
    postcssImport({ addDependencyTo: webpack }),
    postcssCssNext({ browsers: ['last 2 versions', 'IE > 10'] }),
    postcssReporter({ clearMessages: true }),
  ],

  plugins: [],
};

if (env === 'production') {
  config.module.loaders.push({
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel',
  });

  config.plugins.push(
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify(env) } })
  );

  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
  );
} else {
  config.module.loaders.push({
    test: /\.js$/, exclude: /node_modules/, loaders: ['babel'],
  });

  config.plugins.push(
      new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify(env) } })
  );
  // Use Source Map in Dev Environment
  config.devtool = 'cheap-module-eval-source-map';

  config.devServer = {
    contentBase: './presentation'
  };
}

module.exports = config;
