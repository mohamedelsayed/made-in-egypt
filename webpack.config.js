const path = require('path');
const webpack = require('webpack');
const uglifyPlugin = require('uglifyjs-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin')

var jsx = {
    entry: path.join(__dirname,"public/jsx/App.jsx"),
    output: {
        filename: "bundle.js",
        path: path.join(__dirname,"public/webpack")
    },
    module: {
        loaders: [
			{ test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
			{ test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
			{ test: /\.css$/, loader: 'style-loader!css-loader', exclude: /node_modules/ },
			{ test: /\.(png|woff|eot|ttf|svg)/, loader: 'file-loader', exclude: /node_modules/, options: {
				name: "fonts/[name].[ext]",
			} } 
		]
    },
    plugins: [
        new copyWebpackPlugin([
          {
            from: 'node_modules/monaco-editor/min/vs',
            to: 'vs',
          }
        ]),
      ].concat(
        (process.env.NODE_ENV === 'production')? [
            new uglifyPlugin(),
            new webpack.DefinePlugin({
                'http://127.0.0.1:3000': JSON.stringify('https://www.loadeva.com')
            })
        ] : [])
}

module.exports = [jsx];