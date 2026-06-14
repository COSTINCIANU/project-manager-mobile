import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Project Manager",
  slug: "project-manager-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "projectmanager",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0F172A",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "fr.costincianu.projectmanager",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#0F172A",
    },
    package: "fr.costincianu.projectmanager",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission: "Accès à vos photos pour choisir un avatar.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? "https://api.costincianu.fr",
    MERCURE_URL:
      process.env.MERCURE_URL ??
      "https://mercure.costincianu.fr/.well-known/mercure",
  },
});
