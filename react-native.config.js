module.exports = {
  dependencies: {
    // react-native-file-system 只支持 Android，iOS 平台禁用
    'react-native-file-system': {
      platforms: {
        ios: null,
      },
    },
  },
};
