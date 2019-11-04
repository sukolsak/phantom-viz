const path = require('path');

module.exports = {
  entry: './src/index.jsx',
  devtool: 'cheap-eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public')
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        include: path.resolve(__dirname, "src"),
        loader: "babel-loader",
        query: {
          presets: ['@babel/preset-react'],
          cacheDirectory: true
        }
      }
    ]
  }
};
