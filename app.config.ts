import type { ExpoConfig } from 'expo/config';
import site from './site.config.json';

// The domain lives only in site.config.json. Change it there.
const config: ExpoConfig = {
  name: 'Somudai',
  slug: 'somudai',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'somudai',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#FAFAF8',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'app.somudai',
    associatedDomains: [`applinks:${site.domain}`],
  },
  android: {
    package: 'app.somudai',
    adaptiveIcon: {
      backgroundColor: '#FAFAF8',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: site.domain, pathPrefix: '/post' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    output: 'single',
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 120,
        resizeMode: 'contain',
        backgroundColor: '#FAFAF8',
      },
    ],
    'expo-secure-store',
    'expo-image',
    'expo-web-browser',
    // iOS needs the reversed iOS client ID as a URL scheme for native Google sign-in.
    ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME },
          ] as [string, object],
        ]
      : []),
    'expo-localization',
    '@sentry/react-native',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    domain: site.domain,
  },
};

export default config;
