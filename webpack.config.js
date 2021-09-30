const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");

// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { InjectManifest } = require("workbox-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");

const isDev = "production" === process.env.NODE_ENV;

let webpackPlugins = [
  new HtmlWebPackPlugin({
    template: path.resolve(__dirname, "public/index.html"),
    filename: "index.html",
  }),
  new Dotenv({
    path: "./.env", // Path to .env file (this is the default)
    systemvars: true,
  }),
  new CopyPlugin({
    patterns: [
      { from: "./src/favicon.ico", to: "" },
      { from: "./src/manifest.json", to: "" },
      { from: "./src/logo192.png", to: "" },
      { from: "./src/logo512.png", to: "" },
      { from: "./src/bg.png", to: "" },
    ],
  }),
];

if (!isDev) {
  webpackPlugins = [
    ...webpackPlugins,
    /*
        By default, this plugin will remove all files inside webpack's output.path directory, 
        as well as all unused webpack assets after every successful rebuild.
        */
    // npm install --save-dev clean-webpack-plugin
    new CleanWebpackPlugin(),
    /*
        Prepare compressed versions of assets to serve them with Content-Encoding.
        */
    // npm install compression-webpack-plugin --save-dev
    new CompressionPlugin({
      test: /\.(css|js|html|svg|jpe?g|png|ico|gif)$/,
      algorithm: "gzip", // zlib,
      // include: /\/includes/,
      // exclude: /\excludes/
      // threshold: 0, // Only assets bigger than this size are processed. In bytes.
    }),
    /*
        This plugin extracts CSS into separate files. It creates a CSS file per JS file which contains CSS. 
        It supports On-Demand-Loading of CSS and SourceMaps.
        */
    // npm install --save-dev mini-css-extract-plugin
    new MiniCssExtractPlugin({
      filename: "static/css/[name].[contenthash:6].css",
    }),
    new InjectManifest({
      swSrc: "./src/src-sw.js",
      swDest: "sw.js",
    }),
  ];
}

module.exports = {
  devtool: isDev ? "source-map" : false,
  context: __dirname,
  entry: "./src/index.js",
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "build"),
    filename: "static/js/main.[contenthash:6].js",
    environment: {
      arrowFunction: false,
      bigIntLiteral: false,
      const: false,
      destructuring: false,
      dynamicImport: false,
      forOf: false,
      module: false,
    },
  },
  devServer: {
    historyApiFallback: true,
    hinst: false
  },
  module: {
    rules: [
      {
        // babel-loader responsible for loading JavaScript files:
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            cacheCompression: false,
            envName: !isDev ? "production" : "development",
          },
        },
        exclude: /node_modules/,
      },
      {
        /*
            css-loader: Parses CSS files, resolving external resources, such as images, fonts, and additional style imports.
            style-loader: During development, injects loaded styles into the document at runtime.
            mini-css-extract-plugin: Extracts loaded styles into separate files for production use to take advantage of browser caching.
            */
        // npm install -D css-loader style-loader mini-css-extract-plugin
        test: /\.css$/,
        use: [
          !isDev ? MiniCssExtractPlugin.loader : "style-loader",
          {
            loader: "css-loader",
            options: { sourceMap: isDev ? true : false },
          },
        ],
      },
      {
        /*
            Handle common image formats. What sets url-loader apart from file-loader is that if the size of the original file is smaller 
            than a given threshold, it will embed the entire file in the URL as base64-encoded contents
            */
        // npm install -D url-loader
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              limit: 8192,
              name: isDev
                ? "[path][name].[ext]"
                : "static/media/[name].[contenthash:6].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(eot|otf|ttf|woff|woff2)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: isDev ? "[path][name].[ext]" : "static/fonts/[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  plugins: webpackPlugins,
  resolve: {
    extensions: [".js"],
    alias: {},
  },
  optimization: {
    minimize: !isDev,
    minimizer: [
      /*
          We will begin with code minification, a process by which we can reduce the size of our bundle at no expense in terms of functionality. 
          We’ll use two plugins for minimizing our code: terser-webpack-plugin for JavaScript code.
          */
      // npm install -D terser-webpack-plugin
      new TerserWebpackPlugin({
        terserOptions: {
          compress: {
            comparisons: false,
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
            ascii_only: true,
          },
          warnings: false,
        },
      }),
      /*
          Just like optimize-css-assets-webpack-plugin but more accurate with source maps and assets using query string, 
          allows to cache and works in parallel mode
          */
      // npm install css-minimizer-webpack-plugin --save-dev
      new CssMinimizerPlugin({
        test: /\.css$/,
        parallel: true,
        // include: "",
        // exclude: "",
        minify: CssMinimizerPlugin.cssnanoMinify,
      }),
    ],
    /* 
      Code splitting can refer to two different approaches:
      1. Using a dynamic import() statement, we can extract parts of the application that make up a significant portion of our bundle size, and load them on demand.
      2. We can extract code which changes less frequently, in order to take advantage of browser caching and improve performance for repeat-visitors.
      
      Let’s take a deeper look at the options we’ve used here:

      chunks: "all": By default, common chunk extraction only affects modules loaded with a dynamic import(). 
          This setting enables optimization for entry-point loading as well.
      minSize: 0: By default, only chunks above a certain size threshold become eligible for extraction. 
          This setting enables optimization for all common code regardless of its size.
      maxInitialRequests: 20 and maxAsyncChunks: 20: These settings increase the maximum number of source files that can be loaded in parallel for entry-point imports and 
          split-point imports, respectively.
      Additionally, we specify the following cacheGroups configuration:

      vendors: Configures extraction for third-party modules.
      test: /[\\/]node_modules[\\/]/: Filename pattern for matching third-party dependencies.
      name(module, chunks, cacheGroupKey): Groups separate chunks from the same module together by giving them a common name.
      common: Configures common chunks extraction from application code.
      minChunks: 2: A chunk will be considered common if referenced from at least two modules.
      priority: -10: Assigns a negative priority to the common cache group so that chunks for the vendors cache group would be considered first.
      We also extract Webpack runtime code in a single chunk that can be shared between multiple entry points, by specifying runtimeChunk: "single".
      */
    splitChunks: {
      chunks: "all",
      minSize: 10000,
      maxSize: 250000,
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module, chunks, cacheGroupKey) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `${cacheGroupKey}.${packageName.replace("@", "")}`;
          },
        },
        common: {
          minChunks: 2,
          priority: -10,
        },
      },
    },
    runtimeChunk: "single",
  },
};
