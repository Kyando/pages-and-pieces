# The phone apps

The game ships to Google Play and the App Store as the same web game inside a native shell, made with [Capacitor](https://capacitorjs.com). `android/` and `ios/` are the native projects; `capacitor.config.ts` sets them up (app id `games.kyando.twicetoldtales`).

What differs from the web page lives in `src/native.ts`:

- **Saving.** Progress is still read and written through `localStorage`, but in the app each write is copied to the app's own preferences (`@capacitor/preferences`) and brought back at launch, since a phone may clear a WebView's storage when it runs short of space.
- **Haptics** through `@capacitor/haptics` (the web's `navigator.vibrate` does nothing on iPhones).
- **Sharing** through the native share sheet (`@capacitor/share`), the picture passing through the app's cache (`@capacitor/filesystem`): Android's WebView has no Web Share.
- **The back button** (`@capacitor/app`) steps back through the WebView's history, which the game keeps as a stack of screens and dialogs, and closes the app from the shelf.

Also: portrait only on phones, the paper colour behind the splash screen and the status bar, and the safe-area insets passed to the page as CSS variables (`--safe-area-inset-*`, read in `src/styles/main.css`).

Only the pictures the game uses are built into it (`scripts/prune-art.ts`): about 12 MB of the 70 MB in `public/art/`.

## Building

```bash
npm run app:sync      # build the web game and copy it into android/ and ios/
npm run app:android   # the same, then open Android Studio
npm run app:icons     # redraw the icon and splash screens (scripts/make-icons.ts)
```

Building Android locally needs [Android Studio](https://developer.android.com/studio) (it brings the Android SDK and Java 21). Without it, GitHub builds the app: the **Android** workflow (`.github/workflows/android.yml`) runs on every push to `main`, or by hand from the Actions tab, and leaves `twice-told-tales-apk` among the run's artifacts. Unzip it and open `app-debug.apk` on an Android phone to install it (the phone asks to allow installs from that app once).

## Publishing on Google Play

1. **Developer account**: [play.google.com/console](https://play.google.com/console), a one-off US$25. A personal account must run a closed test with at least 12 testers for 14 days before the first public release.
2. **Upload key**: a keystore that signs every build sent to Play. Make it once, keep it and its passwords safe (losing it means asking Google to reset it):

   ```bash
   keytool -genkey -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Repository secrets** (Settings → Secrets and variables → Actions): `ANDROID_KEYSTORE_BASE64` (the file, base64-encoded), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`upload`), `ANDROID_KEY_PASSWORD`. From then on each build also leaves `twice-told-tales-aab`, the signed bundle Play takes, numbered by the run so each upload is newer than the last.
4. **Store listing**: `store/icon-512.png` is the icon; Play also needs a 1024 × 500 feature graphic, at least two phone screenshots, a privacy policy URL, the content rating questionnaire and the data safety form (the game collects nothing).

## The App Store

The `ios/` project builds in Xcode, which only runs on a Mac. Without one, a cloud build service (Ionic Appflow, Codemagic, or GitHub's macOS runners) can build and sign it, with an Apple Developer account (US$99 a year).
