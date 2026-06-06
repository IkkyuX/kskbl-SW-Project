/// <reference types="@capawesome/capacitor-live-update" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikkyux.swproject',
  appName: 'ULink',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    LiveUpdate: {
      defaultChannel: 'production',
      readyTimeout: 10000,
      autoDeleteBundles: true,
      autoBlockRolledBackBundles: true,
      autoUpdateStrategy: 'none',
    },
  },
  server: {
    cleartext: true,
  },
};

export default config;
