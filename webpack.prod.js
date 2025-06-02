const baseConfig = require('./webpack.config.js');

module.exports = {
  ...baseConfig,
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          format: {
            comments: /^!/,  // 메타데이터 주석만 보존
          },
          compress: {
            drop_console: true,  // console.log 제거
            drop_debugger: true,  // debugger 제거
          },
        },
        extractComments: false,
      }),
    ],
  },
};