import { ConfigContext, ExpoConfig } from 'expo/config';

const NAME = "groupe3";
const SCHEME = "groupe3";
const IDENTIFIER = `fr.gobelins.${SCHEME}`;
const PROJECT_ID = "cab54c5b-3910-45c8-b70f-46c3d3835ade";

export default ({ config }: ConfigContext): ExpoConfig => {
  const identifier = process.env.APP_VARIANT === "development" ? `${IDENTIFIER}.dev` : IDENTIFIER;

  return {
    ...config,
    name: NAME,
    owner: "ecni2027",
    slug: SCHEME,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: SCHEME,
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
    extra: {
      router: {},
      eas: {
        projectId: PROJECT_ID,
      }
    }
  }
};
