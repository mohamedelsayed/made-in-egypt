const path = require('path');
const webpack = require('webpack');
const uglifyPlugin = require('uglifyjs-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');
// const ExtractTextPlugin = require("extract-text-webpack-plugin");

var jsx = {
    entry: path.join(__dirname,"public/jsx/App.jsx"),
    output: {
        filename: "bundle.js",
        path: path.join(__dirname,"public/webpack")
    },
    module: {
        rules: [
			{ test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
			{ test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
            { test: /\.css$/, loader: "style-loader!css-loader", include: /node_modules/ },
			{ test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)/, loader: 'url-loader', options: {
                name: "fonts/[name].[ext]",
                limit: 100000
			} } 
		]
    },
    plugins: []
        // .concat(new ExtractTextPlugin("styles.css"))
        .concat((process.env.NODE_ENV === 'production')?
            (
                new uglifyPlugin()
                // new webpack.DefinePlugin({
                    // 'http://127.0.0.1:3000': JSON.stringify(`http${process.env.SECURE? "s" : ""}://${ process.env.ROUTE || 'www.madeinegypt.com' }`),
                    // 'http://localhost:3000': JSON.stringify(`http${process.env.SECURE? "s" : ""}://${ process.env.ROUTE || 'www.madeinegypt.ga' }`)
                // }) 
            ) : []
        )
}

module.exports = [jsx];