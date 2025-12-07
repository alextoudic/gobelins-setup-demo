import { ConfigContext, ExpoConfig } from 'expo/config';

const GROUPE_NAME = "demo";
const IDENTIFIER = `fr.gobelins.${GROUPE_NAME}`;
const OWNER = "ecni2027";

export default ({ config }: ConfigContext): ExpoConfig => {
  const identifier = process.env.APP_VARIANT === "development" ? `${IDENTIFIER}.dev` : IDENTIFIER;

  return {
    ...config,
    name: "setup-demo",
    owner: OWNER,
    slug: GROUPE_NAME,
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
      url: "https://u.expo.dev/cc4cfc30-ecd2-4cf1-aa80-1101d5dae90f"
    },
    runtimeVersion: {
      policy: "fingerprint"
    },
    extra: {
      router: {},
      eas: {
        projectId: "cc4cfc30-ecd2-4cf1-aa80-1101d5dae90f"
      }
    },
  }
};
