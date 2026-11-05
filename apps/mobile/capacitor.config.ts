import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.uknowncode.app',
  appName: 'UknownCode AI',
  webDir: 'dist',
  backgroundColor: '#0b1220',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
