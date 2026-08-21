import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securevault.app',
  appName: 'SecureVault',
  webDir: 'dist/secure-vault/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#090d16'
    }
  }
};

export default config;
