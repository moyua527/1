import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duijie.app',
  appName: 'DuiJie',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
