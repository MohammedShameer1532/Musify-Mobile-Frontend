const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");


const config = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    babelTransformerPath: require.resolve("react-native-qrcode-svg/textEncodingTransformation"),
  },
});

module.exports = withNativeWind(config, { input: "./global.css" });