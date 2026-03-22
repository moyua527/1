import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duijie.app',
  appName: 'DuiJie',
  webDir: 'dist',
  server: {
    url: 'http://160.202.253.143:1800',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
