# Pebble Architecture

Pebble is an Expo SDK 57 / React Native application using strict TypeScript, Expo Router, Supabase, and a native GL presentation layer.

## Application structure

- `app/`: deterministic authentication/active-connection route gates.
- `app/(auth)/`: sign-in and profile registration.
- `app/(app)/bowl.tsx`: primary personal Bowl route.
- `app/(app)/pairing.tsx`: connection invitation/join ritual.
- `app/(app)/settings/`: profile, language, connection history, notifications/sounds, and account administration.
- `app/(app)/bowl/[id].tsx`: immutable past connection bowl.
- `app/(app)/bowl-lab.tsx`: development-only visual harness; redirects outside `__DEV__` and never touches Supabase.
- `src/features/bowl/`: finite held-state service, deterministic layouts, procedural geometry, native renderer, 2D fallback, environmental light, and interaction state.
- `src/design/`: graphite/mineral design tokens and the Source Serif 4 / Source Sans 3 font loader.
- `src/i18n/`: persisted English/Hungarian localization.
- `src/features/pairing/`: client connection queries and secure invitation RPC calls.
- `src/features/notifications/`, `sound/`, `widget/`: restrained peripheral feedback.
- `supabase/migrations/`, `functions/`, `tests/`: forward-only schema, protected server operations, and pgTAP security tests.

The Shore presentation and its bounded accumulated-history renderer were removed. Stable database table and RPC names containing `shore` remain only where renaming them would add migration risk; the client presents Connection and Bowl terminology.

## Session and navigation gate

`AppSessionProvider` owns one Supabase session subscription and one active-connection lookup. No route redirects until both are resolved. Unauthenticated users reach Auth; authenticated users with an active connection reach Bowl; authenticated users without one reach Pairing. Every unresolved and recoverable failure state renders a full-screen loading or localized retry surface.

## Connection domain

A person may retain many ended connections but may belong to at most one active connection. Database triggers serialize membership changes and enforce the two-person maximum and one-active-connection rule. Invitations are server-generated, hash-only at rest, expiring, single-use, rate-limited, and consumed atomically.

Each completed connection owns exactly `private.total_pair_pebbles()` active stable rows in `public.pair_pebbles`; the permanent value is six. Three begin with the creator and three with the joining member. `id`, `pair_id`, `visual_seed`, `visual_variant`, and `created_at` are immutable. Direct client writes are revoked; RLS exposes only active identities currently held by the caller, so a member cannot query the partner's bowl.

`public.pebbles` remains the immutable transfer/touch event history. Phase 18 safely reduces Phase 17 development sets by retiring two deterministically chosen identities that have no transfer history, preferring one per current holder. Retired identities remain service-role-auditable but are absent from RLS, Bowl state, and transfer selection. If fewer than two untouched provisional identities exist, the connection is marked `legacy-six-migration-required` and transfers are blocked instead of rewriting history. A deferred active-set trigger requires exactly six non-retired holders for every normal completed active connection.

## Transfer and touch

`send_pebble(text, uuid)` derives the sender from `auth.uid()`, locks the selected identity and connection, verifies active membership and current ownership, resolves the other member, inserts one transfer event, changes the holder, and records an idempotency key in one transaction. Sender spoofing, partner-owned transfer, non-member transfer, duplicate requests, waiting connections, and ended connections are rejected server-side.

`touch_pebble(uuid)` accepts only the current holder touching the latest eligible incoming transfer in an active connection. It changes only the irreversible `touched` boolean. It does not transfer the identity and stores or exposes no touch timestamp.

`get_bowl_state(uuid)` returns only identities currently held by the caller plus the minimal latest-transfer state needed for touch. The client subscribes to pair-filtered `pair_pebbles` and `pebbles` Realtime changes and re-fetches this protected projection.

## Native bowl presentation

React Three Fiber's native canvas uses Expo GL—no WebView or DOM layer. One demand-driven renderer contains the bowl, all held pebbles, lights, and contact grounding. Pixel ratio is capped at 1.35, or 1 in the low-quality lab mode. Camera distance is calculated from the measured Canvas aspect ratio and bowl diameter to hold a 74% projected width with at least 24 logical pixels of side clearance. Geometry complexity is bounded, layouts for zero through six are fixed, and resources/timers are disposed on teardown. Active interaction explicitly invalidates frames; a resting scene stops requesting them. GL initialization/render errors fall back to a responsive 2D bowl with the same state and interaction semantics.

Procedural identities combine persisted seeds with a stable six-role `visual_variant` for guaranteed differentiation in flattening, proportions, dents, asymmetry, value, and material response. `getBowlEnvironment(date)` continuously interpolates local-time light and subtle calendar-season variation inside a readable bright-dark range, with no location, weather, network, or relationship input.

## Typography, localization, sound, and notifications

Source Serif 4 is loaded only for relational statements; Source Sans 3 is the functional system voice. The native splash remains until fonts resolve. English is fallback; Hungarian is selected by explicit preference or Hungarian system locale. Preferences update immediately and persist locally.

Expo Audio supplies the lifecycle boundary for optional bowl sound. The setting defaults off and no placeholder audio assets ship. Push tokens remain owner-isolated; delivery is service-role-only inside the Edge Function. Push content says only “A pebble arrived.” and contains no badge value, count, exact time, activity, or response prompt. Client notification handling explicitly avoids setting badges.

## Platform boundary

The permanent iOS/Android identifier is `io.github.viktormajor.pebble`. Expo GL, Expo Audio, Expo Font, and notification/icon configuration are native changes, so the first use of this milestone requires a new EAS development build. Changing JavaScript, Supabase data, local Wi-Fi, or LAN IP afterward does not require another APK.

## Product boundary

The architecture must preserve `PRODUCT_INVARIANTS.md`: no chat, authored payload, reaction, partner inventory comparison, online status, exact touch/read time, response metric, streak, score, achievement, engagement reminder, discovery, feed, or relationship analytics.
