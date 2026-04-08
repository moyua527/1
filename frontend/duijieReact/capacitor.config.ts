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
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
