# Premium Bowl Art Direction

## Product metaphor

Pebble is a private connection between exactly two people. Each person normally sees only their own bowl. A connection owns one finite set of eight persistent pebbles; the same physical identities travel between bowls. The partner's current bowl is deliberately not displayed, because side-by-side inventories would turn presence into accounting.

An empty bowl is complete. It is neither missing content nor a prompt for the other person to act. The only caption is “The bowl is empty.” / “A tál most üres.” No count, capacity, debt, activity, or response-time information is shown.

## Persistent ownership

`public.pair_pebbles` stores stable identity, connection, current holder, visual seed, and integrity timestamps. Its RLS exposes only the caller's currently held identities; even a legitimate member cannot directly query the partner's bowl. `public.pebbles` remains the immutable transfer/touch event table so existing history is not rewritten. Transfers atomically lock and move an identity, create an event, and preserve idempotency. Touch acknowledges only the latest eligible arrival and never transfers it back.

`TOTAL_PAIR_PEBBLES` is isolated in the client and `private.total_pair_pebbles()` is isolated in the database. Both are provisionally eight. Completed new connections begin with four identities held by each member. Existing two-person local connections receive a safe eight-identity baseline; legacy events remain unchanged and unlinked rather than receiving invented identities.

## Visual and material language

The world is deep graphite with cool blue-grey atmosphere and restrained warm mineral light. The shallow bowl is smoke-grey, matte, slightly asymmetric, and lighter inside. Its empty interior exposes curvature and a quiet tonal center. The scene has no literal room, table, beach, landscape, decorative cards, particles, or reward effects.

Pebbles use seeded icosahedral deformation adapted conceptually from the earlier Pebble repository: deterministic pseudo-random proportion, flattening, broad asymmetry, controlled dents, a softened base, related mineral colors, high roughness, very low clearcoat, and soft contact grounding. The old browser implementation's DOM canvas textures, `window`, `document`, `ResizeObserver`, renderer DOM mounting, pointer media queries, continuous spin/float, skins, patina progression, and relationship telemetry were not reused.

## Composition and motion

Counts zero through eight each have a fixed art-directed layout. Slots define position, rotation, scale, layer, and predictable arrival/departure space. There is no rigid-body engine, random settling, free camera, or orbit control.

Resting objects are still. Holding lifts one pebble and separates its shadow; cancellation returns it to its slot. Transfer rises and recedes without sparkle. A newly arrived untouched stone receives only a restrained warm edge. Touch returns it to the ordinary material state. Reduced motion removes lift/travel and relies on short state changes.

## Typography

Source Serif 4 is the relational voice for rare atmospheric statements, onboarding, and the empty bowl caption. Source Sans 3 is the system voice for navigation, settings, labels, forms, errors, and accessibility-essential controls. Both are distributed under the SIL Open Font License 1.1 and include Hungarian `ő`, `Ő`, `ű`, and `Ű`. The splash remains visible until fonts load, preventing fallback-font flashes.

## Environmental light

The injected `getBowlEnvironment(date)` function continuously interpolates morning, day, evening, and night palettes from local device time. Calendar day adds only a very small northern-hemisphere seasonal warmth variation. It requests no location, weather, relationship, or network data. Functional foreground colors remain independent design tokens with accessible contrast.

## Sound and notifications

Sound is optional and disabled by default. The Expo Audio lifecycle/preference boundary and send/arrival/touch integration points exist, but no placeholder tones ship. `assets/audio/README.md` defines recording, loudness, trimming, duration, and licensing requirements.

Push content says only that a pebble arrived. Payloads omit numeric badges, counts, timestamps, activity, and response prompts. The app explicitly avoids setting a badge. Android launchers may display their own neutral notification dot; the application cannot force its appearance or color consistently.

## Accessibility and fallback

The main control is the pebble itself, with a deliberate hold for transfer and a short tap for an eligible arrival touch. Touch targets, screen-reader labels, localized errors, reduced motion, scalable typography, Android back navigation, and scrollable administrative screens remain required.

The native scene uses one React Three Fiber canvas backed by Expo GL, capped at 1.5 device pixel ratio and rendered on demand. Geometry and frame timers are disposed on teardown; Realtime subscriptions stop with the route. A React error boundary and explicit development switch provide a tactile 2D bowl fallback with the same finite composition and interactions, so GL failure cannot create a blank screen.

## Development Bowl Lab

`/(app)/bowl-lab` exists only when `__DEV__` is true and redirects in production. It never reads or writes Supabase. It previews all counts, all stable seeds, four light phases, four seasonal samples, incoming/touched state, send removal, reduced motion, GL fallback, bilingual typography, a small viewport, and large text.
