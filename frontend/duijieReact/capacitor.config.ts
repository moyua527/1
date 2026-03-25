import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duijie.app',
  appName: 'DuiJie',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#f1f5f9',
    overrideUserAgent: 'DuiJie-App/1.0 Android',
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
    hostname: '160.202.253.143',
    url: 'http://160.202.253.143:8080',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
