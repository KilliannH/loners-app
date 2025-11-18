module.exports = {
  expo: {
    name: "loners",
    slug: "loners",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "loners",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      "supportsTablet": true,
      "bundleIdentifier": "com.loners",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    android: {
      "package": "com.loners",
      "softwareKeyboardLayoutMode": "pan",
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      ios: {
        "supportsTablet": true,
        "bundleIdentifier": "com.loners.app"
      },
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6366F1",
          "sounds": [
            "./assets/notification-sound.wav"
          ]
        }
      ]
    ],
    experiments: {
      "typedRoutes": true,
      "reactCompiler": true
    },
    extra: {
      "router": {},
      "eas": {
        "projectId": process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      },
      "placesApiKey": process.env.EXPO_PUBLIC_PLACES_API_KEY
    },
    owner: "killiann"
  }
}