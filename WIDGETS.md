# Pebble Widgets

## Current Platform: iOS

Pebble uses Expo SDK 57's `expo-widgets` module for an iOS home-screen widget. It requires an iOS development or production build; it does not run in Expo Go. The widget target is generated through the `expo-widgets` config plugin and requires the configured iOS bundle identifier.

The widget displays one quiet visual pebble and, when applicable, the neutral phrase "A pebble arrived." It is updated only while Pebble is able to refresh its local snapshot. It is not a background realtime channel and is not a delivery guarantee.

Tapping the widget opens `pebble://bowl`, which routes into the authenticated Bowl flow. The widget never sends a pebble itself. This preserves the deliberate hold and avoids accidental one-tap sending.

## Android Limitation

This phase intentionally does not enable Android widgets. The installed Expo Widgets config plugin has an explicitly opt-in Android path, while the SDK 57 Expo Widgets documentation describes the public widget runtime as iOS-only. Pebble therefore does not claim Android widget parity or ship an unverified Android widget implementation.

An Android implementation should be added only after the Expo Android widget runtime is documented as stable for this SDK and verified in a native development build. It must retain the same deep-link-only behavior rather than performing a direct send.

## Constraints

The widget is an ambient presence surface. It contains no counts, scores, streaks, timestamps, response information, online state, inventory comparison, or relationship evaluation. Widget code runs in an isolated runtime and must not fetch Supabase data, use React hooks, or perform asynchronous work.
