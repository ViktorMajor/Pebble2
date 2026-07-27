# Pebble Engineering Principles

Pebble is a mobile application built with React Native, Expo, TypeScript, and Expo Router.

## Product Concept

Pebble is a private digital space between exactly two people.

Its purpose is extremely simple: one person can send the other person a pebble.

A pebble roughly means:

- "I thought of you."
- "I am here."
- "You crossed my mind."

The application deliberately does not allow text communication.

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase for authentication, PostgreSQL, Realtime, and server-side functionality
- Expo Haptics
- Expo Notifications later

## Engineering Principles

- Use strict TypeScript.
- Keep architecture simple and maintainable.
- Create reusable components where useful.
- Avoid premature abstraction.
- Avoid unnecessary dependencies.
- Never commit secrets.
- Database changes must use migrations.
- Security rules must be enforced server-side and database-side.
- Accessibility must be considered.
- Support iOS and Android.
- Code must be testable.

## Current Phase

This repository has a Shore experience backed by Supabase: minimal authentication, secure server-controlled pairing, real pebble sending, recipient-only irreversible touches, pair-scoped Realtime synchronization, server-side Expo push delivery, explicit shore/account lifecycle controls, bounded spatial shore memory, local calendar-driven environmental variation, and an iOS ambient widget. There are no inactivity reminders or notification engagement mechanics.
