# RUN PEBBLE ON MY PHYSICAL ANDROID PHONE WITHOUT AN EMULATOR

This workflow uses an EAS cloud-built Android development client and Metro over your local network. Android Studio, an Android emulator, and local Gradle builds are not part of the normal loop.

## Application ID decision

Pebble's permanent Android package name and iOS bundle identifier are both `io.github.viktormajor.pebble`. They are configured in [app.json](app.json) and the generated `android/` project.

Changing either identifier later makes the operating system treat the build as a different app: the existing app must be uninstalled and its local data is not retained.

## One-time setup

1. Use an Expo account and install the EAS CLI without adding it to the project:

   ```bash
   npx eas-cli@latest login
   ```

2. Ensure the phone and the development computer are on the same Wi-Fi/LAN. Turn off a VPN on either device if it prevents local-network access.

3. Make sure the computer firewall allows inbound TCP connections to ports `8081` (Metro) and `54321` (the local Supabase gateway) from the local network.

4. Enable installation from the browser or file manager that will open the APK on the phone. This is the Android "Install unknown apps" permission.

5. The permanent identifiers above are already configured. If either changes in the future, update the Expo configuration and native Android project before building; installed Android builds will need to be replaced.

## Create the EAS Android development build

The committed [eas.json](eas.json) profile creates an internally distributed APK with `expo-dev-client` enabled. It runs Expo prebuild on the cloud builder so the generated Android project includes the development client; it does not invoke local Gradle.

```bash
npx eas-cli@latest build --platform android --profile development
```

On the first run, EAS may prompt to create/link the Expo project. Accept it for this Pebble project. Copy the resulting EAS project ID into the local `.env` as `EXPO_PUBLIC_EAS_PROJECT_ID`; this is public app configuration, not a secret, and lets Expo push-token registration identify the EAS project.

## Install the APK

1. Open the build page URL printed by EAS on the Android phone (or transfer the downloaded APK to the phone).
2. Download the APK and approve the Android install prompt.
3. Open **Pebble** once. It is a development client and will wait for Metro until the next section.

## Normal portable phone workflow

1. Connect the laptop and phone to the same normal Wi-Fi network.
2. From the repository root, run:

   ```bash
   npm run dev:phone
   ```

The launcher derives the IPv4 source address of the laptop's default route, exports `EXPO_PUBLIC_SUPABASE_URL` for Metro as `http://<current-lan-ip>:54321`, checks the local Supabase API over that LAN address, starts Supabase when it is not running, starts local Edge Functions when needed, and launches Expo in development-client LAN mode. It does not alter `.env`, reset the database, or print credentials.

Open Pebble on the phone and select or scan the development server shown by Metro. Changing Wi-Fi/LAN IP does **not** require a new EAS APK.

In development builds, Bowl Lab is available inside Pebble at **Settings → Development → Open Bowl Lab**. It does not require ADB. Pebble now has its own labeled **Settings / Beállítások** control on both Bowl and Pairing; that is the product navigation. The floating gear, ellipsis, mute, or moon controls that Expo may draw over the app belong to Expo Dev Client, not Pebble. They can be disabled in the development client through **Settings → Tools button**, and they are absent from production builds. Development layout reserves clearance so the external tool button does not cover Pebble's Settings action.

## Initial local environment setup

1. Get the local **anon** key from the output of `supabase status` (or `supabase status -o env`). Never use or place a service-role key in `.env`.

4. Copy the template and replace the placeholders:

   ```bash
   cp .env.example .env
   ```

   The resulting `.env` must contain this shape, with any placeholder LAN URL and the local anon key:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=http://placeholder:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
   EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID
   ```

   `.env` is gitignored. `EXPO_PUBLIC_*` values are bundled into the development app, so only use the anon key there; do not put service-role, push, or other private keys in it.

The launcher replaces the URL only in its own Expo process using the current default-route LAN address. The local Supabase gateway must be published on all interfaces at port `54321`; the launcher preflights this. The Android development manifest permits cleartext HTTP for debug/development builds. This is only appropriate for the trusted local LAN; production must use HTTPS.

## Start Metro and connect the installed build

1. Start Metro with `npm run dev:phone`.

2. Keep that terminal open. Expo prints a development URL/QR code using the computer's LAN address.
3. Open Pebble on the phone. If it does not automatically offer the local server, use the development-client launcher to scan the QR code or enter the printed `exp+pebble://...` URL.
4. If Metro cannot be reached, confirm both devices are on the same LAN, then check the firewall/VPN and that port `8081` is allowed. Do not switch to an emulator or a local Android build for this workflow.

## What to repeat

For ordinary TypeScript, JavaScript, styling, or UI changes: save the files and keep Metro running. Fast Refresh reloads the installed development client; no APK/EAS build is needed. Restart `npm run dev:phone` after changing Wi-Fi so Metro receives the newly derived URL.

Some guest/public networks use client isolation even when both devices show the same Wi-Fi SSID. In that case Metro LAN and laptop-local Supabase cannot be reached from the phone. `npx expo start --dev-client --tunnel` can tunnel Metro, but Metro tunneling alone does **not** make the laptop-local Supabase API available to an isolated phone.

Create and reinstall a new EAS development APK only after native dependency/config changes: adding or upgrading a library with native code, changing Expo config/plugins, Android permissions, the Android package name, native Android files, or the Expo SDK/native runtime. Then rerun the EAS build command and install its APK before returning to the Metro loop.

## Premium Bowl native runtime

The Premium Bowl milestone adds Expo GL, Expo Audio, Expo Font/Splash configuration, native notification icon configuration, and React Three Fiber's native renderer. These are native dependency/configuration changes, so install one new development APK before testing this milestone:

```bash
npx eas-cli@latest build --platform android --profile development
```

After that APK is installed, changing Wi-Fi, local Supabase data, TypeScript, bowl geometry, layouts, colors, light, animation, copy, or other JavaScript does not require another EAS build. Use the normal `npm run dev:phone` loop.

The Bright Dark Bowl / six-pebble refinement adds no native dependency or native configuration. The installed Premium Bowl development APK can load it through Metro; the Three.js version alignment is JavaScript-only.

The full-screen measured Bowl layout and structured Bowl Lab are also JavaScript/TypeScript changes. They use the native modules already present in that installed development APK, so no new EAS build is required.

The Luminous Pebble navigation, materials, pairing states, and environmental palette are likewise JavaScript/TypeScript-only. Test them in the already installed SDK 57 development build with `npm run dev:phone`; do not create a new EAS build for this milestone.
