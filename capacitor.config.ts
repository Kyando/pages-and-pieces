import type { CapacitorConfig } from '@capacitor/cli';

/** The phone apps: the built web game (dist/) inside a native shell. See docs/app.md. */
const config: CapacitorConfig = {
  appId: 'games.kyando.twicetoldtales',
  appName: 'Twice Told Tales',
  webDir: 'dist',
  backgroundColor: '#f5ead6',
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: '#f5ead6',
      showSpinner: false,
    },
    // Edge to edge, like the web page (viewport-fit=cover): the game pads itself clear of the notch
    // and the gesture bar, with insets Capacitor hands it as CSS variables on every Android version.
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // Dark icons, on the light paper.
      style: 'LIGHT',
    },
  },
};

export default config;
