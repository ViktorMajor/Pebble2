# Pebble Architecture

Pebble is an Expo and React Native mobile application using TypeScript and Expo Router.

## Current Scope

The current repository contains:

- Expo application configuration
- Expo Router entry structure
- strict TypeScript configuration
- linting
- basic tests
- product and engineering documentation
- minimal Supabase authentication plumbing
- Supabase migrations for the base private-shore data model
- secure server-controlled shore pairing
- server-controlled pebble sending
- recipient-only, irreversible pebble touching
- pair-scoped Supabase Realtime synchronization
- owner-isolated device push token registration and server-side Expo push delivery
- server-controlled shore closure and account deletion lifecycle
- bounded spatial shore-memory rendering for long histories
- local calendar-driven shore environment variation
- iOS-only ambient widget and targeted product-invariant guardrails
- RLS/database tests for the base data model

Push notifications are opt-in and event-driven only. Pebble does not send inactivity reminders.

## Planned Application Structure

- `app/`: Expo Router routes and layouts.
- `src/features/auth/`: minimal Supabase authentication UI and helpers.
- `src/features/pairing/`: shore creation and invitation joining UI backed by RPCs.
- `src/features/shore/`: send, touch, and pair-scoped realtime shore experience.
- `src/features/notifications/`: device token registration and native notification lifecycle handling.
- `src/features/lifecycle/`: close-shore and account-deletion controls.
- `src/features/widget/`: platform-specific widget snapshot synchronization.
- `src/content/`: reusable user-facing copy covered by vocabulary guardrails.
- `src/lib/`: shared infrastructure clients.
- `supabase/migrations/`: database schema changes.
- `supabase/functions/`: protected server-side operations.
- `supabase/tests/`: database and RLS tests.
- `test/`: basic project and invariant tests.
- `assets/`: Expo application assets.

## Planned Backend Direction

Supabase provides authentication and PostgreSQL. Database changes must be introduced through migrations. Private shore data is protected with server-side and database-side security rules, including Row Level Security on exposed application tables.

Shore pairing is controlled through Postgres RPCs:

- `create_shore_with_invite()` creates a shore, inserts the creator as first member, stores only a token hash, and returns the raw invite once.
- `join_shore_with_invite(text)` hashes the submitted token, rate-limits invalid attempts, validates expiry and single-use state, locks pair/invite state, checks capacity, inserts membership, and consumes the invite atomically.

Pebble sending is controlled through `send_pebble(text)`. The client supplies only an idempotency request key. The database derives `sender_id` from `auth.uid()`, finds the authenticated user's active shore, rejects closed or ambiguous shore state, prevents direct sender spoofing, rejects rapid repeat sends, and stores only the pebble event fields.

Pebble touching is controlled through `touch_pebble(uuid)`. Direct `touched` writes are revoked. The function locks the pebble, verifies that the authenticated user is a current shore member but not the sender, and transitions `touched` only from `false` to `true`. A database trigger prevents reversal or any mutation to the event fields.

The client fetches its active shore and subscribes only to `pebbles` events filtered by that shore's ID. The table is published to Supabase Realtime, while its RLS read policy remains the server-side visibility boundary. Incoming events are merged by pebble ID so reconnects, fetch races, and duplicate deliveries do not create duplicate shore entries or reverse a touched state.

Device push tokens are stored in `device_push_tokens` behind owner-only RLS policies. The mobile client registers only its current device token and never queries partner tokens. `deliver-pebble-push` is a Supabase Edge Function: it authenticates the sender, verifies the pebble belongs to that sender, resolves the partner's tokens with server-only credentials, and sends the fixed notification body through Expo. It removes immediately invalid tokens and uses a non-readable internal delivery record to prevent repeat delivery for a pebble.

`close_shore(uuid)` locks and closes a shore for either current member, invalidates outstanding invitations, and leaves historical pebbles visible without allowing new sends or touches. Closed shore state is published through Realtime so an open partner client moves to its static view. `delete-pebble-account` is a protected Edge Function that closes active shores, removes the requester's push tokens, deletes their account, and removes now-empty shores. The exact data-retention contract is in `LIFECYCLE.md`.

`get_shore_memory(uuid)` returns only the newest 24 pebble records for individual rendering and a capped visual density for older records. The client renders the older portion as up to 96 non-interactive foundation stones. No totals, rates, or rankings are shown, and rendering work stays bounded even when the stored shore history is large.

`useShoreEnvironment()` derives light and seasonal palette changes only from the device's local calendar and clock. It refreshes while the app is active and on foregrounding. It has no database input and does not inspect pebble history, user behavior, or relationship state, so silence always leaves the shore complete and peaceful.

The iOS `PebbleWidget` is built with Expo Widgets and SwiftUI components. It is updated from app-owned snapshots and deep-links only to the normal Shore route, preserving intentional sending. Android widgets are deliberately not enabled until the Expo runtime has stable documented support. `PRODUCT_GUARDRAILS.md` describes the targeted schema, copy, and feature-structure checks included in `npm test`.

## Boundaries

The architecture must preserve `PRODUCT_INVARIANTS.md`. Do not add chat, authored pebble payloads, reactions, scores, streaks, public profiles, social feeds, online presence, response-time exposure, or behavioral tracking that the product does not require.
