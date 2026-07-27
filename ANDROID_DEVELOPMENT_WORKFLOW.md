# RUN PEBBLE ON MY PHYSICAL ANDROID PHONE WITHOUT AN EMULATOR

This workflow uses an EAS cloud-built Android development client and Metro over your local network. Android Studio, an Android emulator, and local Gradle builds are not part of the normal loop.

## Application ID decision

The current Android package name is `com.pebble.app`. It is a placeholder-style identifier and is present both in [app.json](app.json) and the generated `android/` project.

Choose Pebble's permanent Android application ID now, before creating an installable development build that you intend to keep. It should be a reverse-domain ID you control, for example `com.yourdomain.pebble`. Changing it later makes Android treat the build as a different app: the existing app must be uninstalled and its local data is not retained. This workflow deliberately does not change the identifier until that decision is made.

## One-time setup

1. Use an Expo account and install the EAS CLI without adding it to the project:

   ```bash
   npx eas-cli@latest login
   ```

2. Ensure the phone and the development computer are on the same Wi-Fi/LAN. Turn off a VPN on either device if it prevents local-network access.

3. Make sure the computer firewall allows inbound TCP connections to ports `8081` (Metro) and `54321` (the local Supabase gateway) from the local network.

4. Enable installation from the browser or file manager that will open the APK on the phone. This is the Android "Install unknown apps" permission.

5. Decide the permanent application ID above. If changing it, change the Expo `android.package` and regenerate/update the native Android project before the first build. Do not make that change solely for this workflow.

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

## Start local Supabase and create the phone environment

1. From the repository root, start the local stack:

   ```bash
   supabase start
   ```

2. Find the computer's LAN IPv4 address from the active Wi-Fi/Ethernet adapter. Do not use a Docker address, `localhost`, or `127.0.0.1`.

3. Get the local **anon** key from the output of `supabase status` (or `supabase status -o env`). Never use or place a service-role key in `.env`.

4. Copy the template and replace the placeholders:

   ```bash
   cp .env.example .env
   ```

   The resulting `.env` must contain this shape, with your actual LAN IPv4 address and local anon key:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=http://YOUR_COMPUTER_LAN_IP:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY
   EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID
   ```

   `.env` is gitignored. `EXPO_PUBLIC_*` values are bundled into the development app, so only use the anon key there; do not put service-role, push, or other private keys in it.

The local Supabase gateway is published on all interfaces at port `54321`, so the phone reaches it at `http://YOUR_COMPUTER_LAN_IP:54321`. The Android development manifest permits cleartext HTTP for debug/development builds. This is only appropriate for the trusted local LAN; production must use HTTPS.

## Start Metro and connect the installed build

1. Start Metro in LAN development-client mode:

   ```bash
   npm run start:android:lan
   ```

2. Keep that terminal open. Expo prints a development URL/QR code using the computer's LAN address.
3. Open Pebble on the phone. If it does not automatically offer the local server, use the development-client launcher to scan the QR code or enter the printed `exp+pebble://...` URL.
4. If Metro cannot be reached, confirm both devices are on the same LAN, then check the firewall/VPN and that port `8081` is allowed. Do not switch to an emulator or a local Android build for this workflow.

## What to repeat

For ordinary TypeScript, JavaScript, styling, or UI changes: save the files and keep Metro running. Fast Refresh reloads the installed development client; no APK/EAS build is needed. Restart Metro after changing `.env`, because `EXPO_PUBLIC_*` values are read by the bundler.

Create and reinstall a new EAS development APK only after native dependency/config changes: adding or upgrading a library with native code, changing Expo config/plugins, Android permissions, the Android package name, native Android files, or the Expo SDK/native runtime. Then rerun the EAS build command and install its APK before returning to the Metro loop.
