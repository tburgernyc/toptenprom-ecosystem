// @ts-check
/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // WatermelonDB decorator support (legacy decorators)
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      // Path aliases matching tsconfig paths
      [
        "module-resolver",
        {
          root: ["."],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
          },
        },
      ],
    ],
  };
};
