const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json', force: true },
        { from: 'src/content.js', to: 'js/content.js', force: true },
        { from: 'src/background.js', to: 'js/background.js', force: true },
        { from: 'src/assets/icon16.png', to: 'assets/icon16.png' },
        { from: 'src/assets/icon32.png', to: 'assets/icon32.png' },
        { from: 'src/assets/icon48.png', to: 'assets/icon48.png' },
        { from: 'src/assets/icon128.png', to: 'assets/icon128.png' },
      ],
    }),
    new HTMLPlugin({
      title: 'Jira Metrics Plugin',
      filename: 'index.html',
      template: './src/template.html',
      inject: 'body',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HTMLPlugin({
        title: 'React extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
