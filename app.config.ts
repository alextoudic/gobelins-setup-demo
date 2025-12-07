import { ConfigContext, ExpoConfig } from 'expo/config';
import groupConfigs from './group-configs.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const { owner, slug, projectId } = groupConfigs[process.env.GROUP_NAME as keyof typeof groupConfigs] ?? groupConfigs.demo;
  
  const baseIdentifier = `fr.gobelins.${slug}`;
  const identifier = process.env.APP_VARIANT === "development" ? `${baseIdentifier}.dev` : baseIdentifier;

  return {
    ...config,
    name: "setup-demo",
    owner,
    slug,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "setupdemo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: identifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: identifier,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    updates: {
      url: `https://u.expo.dev/${projectId}`
    },
    runtimeVersion: {
      policy: "fingerprint"
    },
    extra: {
      router: {},
      eas: {
        projectId
      }
    },
  }
};
