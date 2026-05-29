module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Must be last — reanimated requires this
      "react-native-reanimated/plugin",
    ],
  };
};
