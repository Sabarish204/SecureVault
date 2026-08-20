import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securevault.app',
  appName: 'SecureVault',
  webDir: 'dist/secure-vault/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
