const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const pkg = require("./package.json");
const pluginConfig = require("./src/config.json");
pluginConfig.version = pkg.version;

const meta = (() => {
  const lines = ["/**"];
  for (const key in pluginConfig) {
    lines.push(` * @${key} ${pluginConfig[key]}`);
  }
  lines.push(" */");
  return lines.join("\n");
})();

module.exports = {
  mode: "development",
  target: "node",
  devtool: false,
  entry: "./src/index.tsx",
  output: {
    filename: "LMTools.plugin.js",
    path: path.join(__dirname, "dist"),
    libraryTarget: "commonjs2",
    libraryExport: "default",
    compareBeforeEmit: false
  },
  externals: {
    "react": "BdApi.React",
    "react-dom": "BdApi.ReactDOM"
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".css"],
  },
  module: {
    rules: [
      {test: /\.css$/, use: "raw-loader"},
      {test: /\.(jsx|tsx)$/, exclude: /node_modules/, use: "babel-loader"},
      {test: /\.(ts|tsx)$/, exclude: /node_modules/, use: "babel-loader"}
    ]
  },plugins: [
    new webpack.BannerPlugin({raw: true, banner: meta}),
    {
      apply: (compiler) => {
        compiler.hooks.assetEmitted.tap("CopyToBD", (filename, info) => {
          const userConfig = (() => {
            if (process.platform === "win32") return process.env.APPDATA;
            if (process.platform === "darwin") return path.join(process.env.HOME, "Library", "Application Support");
            if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
            return path.join(process.env.HOME, ".config");
          })();
          const bdFolder = path.join(userConfig, "BetterDiscord");
          const pluginsFolder = path.join(bdFolder, "plugins");
          
          try {
            if (fs.existsSync(pluginsFolder)) {
              fs.copyFileSync(info.targetPath, path.join(pluginsFolder, filename));
              console.log(`\n\n✅ Copied to BD folder: ${path.join(pluginsFolder, filename)}\n`);
            } else {
              console.log(`\n\n⚠️  BetterDiscord plugins folder not found at: ${pluginsFolder}\n`);
            }
          } catch (error) {
            console.log(`\n\n❌ Failed to copy to BD folder: ${error.message}\n`);
          }
        });
      }
    }
  ]
};