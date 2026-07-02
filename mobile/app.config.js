const DEFAULT_API_BASE_URL = "https://web-production-3f3a8.up.railway.app";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

module.exports = {
  expo: {
    owner: "wangming2050",
    name: "Korean Learn",
    slug: "korean-learn",
    version: "0.1.0",
    newArchEnabled: true,
    orientation: "default",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#eef7f2"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.koreanlearn.app",
      infoPlist: {
        NSMicrophoneUsageDescription: "用于录音跟读，帮助你回放并对比发音。"
      }
    },
    android: {
      package: "com.koreanlearn.app",
      permissions: ["RECORD_AUDIO"]
    },
    web: {
      bundler: "metro"
    },
    plugins: ["expo-font"],
    extra: {
      apiBaseUrl,
      eas: {
        projectId: "0c84ecb7-8ab4-4305-8aae-2bca8efa42c9"
      }
    }
  }
};
