import 'dotenv/config';

export default {
  expo: {
    name: 'vibe',
    slug: 'vibe',
    version: '1.0.0',
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      package: "com.mattseq.vibe",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: "./google-services.json"
    },
    extra: {
      eas: {
        projectId: "5f3b4903-ecb5-4f7c-bc1b-3a6d00c00668"
      },
      appwrite: {
        projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
        projectName: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME,
        endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT
      },
      klipy: {
        apiKey: process.env.KLIPY_API_KEY
      }
    },
  },
};