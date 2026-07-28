# Premium Bowl Art Direction

## Six circulating objects

Pebble is a private connection between exactly two people. A completed connection permanently owns exactly six physical-feeling pebble identities. Three begin with the creator and three with the joining member. They are created once, never regenerated, never reset, and never duplicated or destroyed while the connection is active. Sending transfers one specific identity; touching acknowledges its latest arrival without sending it back.

The user normally sees only their own bowl. The partner's present inventory is private because a comparison would turn presence into accounting. A person may hold any number from zero through six. There is no daily quota, cooldown, replenishment, automatic redistribution, numerical capacity, or debt language.

Existing Phase 17 development connections are migrated forward without rewriting transfer history. Two untouched provisional identities are retired deterministically, preferring one from each current holder. A retired row remains backend-auditable but cannot be selected, transferred, or returned by Bowl state. If fewer than two untouched identities are available, the connection is marked `legacy-six-migration-required` and transfers stop pending explicit review; the application never fabricates history to force a result.

## Bright dark space

The scene is a quiet blue-hour interior, not a black showroom. Darkness frames the objects but may never hide them. The centre is softened and lighter than the edge, while the bowl and stones maintain explicit material separation. There is no heavy vignette, pure black, RGB edge glow, wellness beige, decorative room, literal table, or landscape.

Core tokens:

- Background edge `#182126`; centre family `#243137`–`#2B383D`; haze family `#2D3C42`–`#34444A`.
- Bowl outer `#626B6B`, inner `#7A817D`, rim `#8B918C`.
- Primary text `#F0ECE4`, secondary `#BFC5C2`, functional `#D9DDDA`, muted `#929B98`.
- Warm key `#CFC4B8`; cool rim `#BAC5C6`.

The warm and cool lights remain low-saturation neutral daylight. Their HSL saturation difference is capped at approximately ten percentage points. Neither may read as orange, cyan, teal, purple, neon, or complementary-color spectacle. Vignette darkening is capped at 12%.

Scene-relative luminance targets are edge `1.00`, centre `1.28`, bowl outer `1.76`, bowl inner `2.02`, and visible pebble face `2.58`. The contact shadow floor is 60% of the adjacent interior value; the rim highlight is capped at 1.25× its local base. These targets are verified as relationships after tone mapping rather than by treating hexadecimal material colors as emitted light.

## Bowl and six identities

The bowl is a shallow hand-formed mineral/ceramic object with high roughness, zero metalness, restrained clearcoat, broad highlights, and a single vertex-colored mesh. A lighter upward-facing interior and readable rim replace overlapping front/back meshes, avoiding z-fighting while keeping the outside medium slate-grey.

Six stable visual roles combine a persisted seed with `visual_variant`: flatter pale mineral-grey, round warm grey, narrow graphite-grey, muted green-grey, softly marked medium-grey, and smaller light slate. Seeded deformation supplies fine individuality; the variant guarantees value and proportion separation. At least three roles are lighter than the bowl interior. The UI never names, ranks, catalogues, values, or assigns rarity to them.

Layouts zero through six are explicit. The initial three form a loose asymmetric triangle with visible bowl material between them. Every slot supplies position, rotation, scale, vertical offset, draw order, arrival origin, departure control point, and departure endpoint. Reduction from eight to six increases negative space, identity recognition, animation clarity, and deterministic test coverage without a physics engine.

## Composition and camera

The renderer measures its real Canvas viewport. A 40-degree vertical perspective camera sits at a 41-degree downward angle. Distance is derived from the 3.84-world-unit bowl diameter and current horizontal field of view, targeting 74% of safe width. The acceptable normal range is 70–78%, never above 80%, with at least 24 logical pixels on each side; the margin constraint wins on exceptionally small viewports.

The camera looks slightly above the bowl so its visual centre settles near 56–60% of usable height. The entire outer contour and rim must remain inside the frustum, clear of relational text, the settings control, and the gesture area. Portrait recalculation, small Android screens, English/Hungarian copy, and font scaling must not clip the object.

## Motion grammar

Resting stones are still. Only low-frequency environmental recalculation may move light; stones never spin, float, bounce, or pulse.

Pickup begins immediately and reaches a clearly lifted state in about 210 ms. The stone rises 0.28 world units, its contact shadow separates, and rotation changes roughly 5–7 degrees. Pointer capture keeps the physical hold stable while the mesh moves. Cancellation uses a strongly damped exponential return to the exact art-directed slot.

Committed departure lasts 820 ms. A quadratic spatial curve preserves identity through lift, slight rotation, acceleration, scene-depth travel, and a late fade. The database transfer begins only after the visible path completes. Arrival lasts 920 ms, enters from depth, stays visible, and eases into the defined slot before a damped final settle. Remaining stones interpolate into their next known layout.

The effective damping uses high exponential decay (`18` pickup, `14` settling), no elastic term, no bounce, and conservative positional thresholds. Reduced motion places objects directly, removes travel and rotation, and keeps transfer/touch semantics intact.

The Canvas remains `frameloop="demand"`. Every active pickup, return, departure, arrival, or layout settle explicitly invalidates the next frame. Once tolerances are reached, invalidation stops. A network request waiting after a completed departure does not keep rendering frames.

## Typography

Source Serif 4 is the relational voice; Source Sans 3 is the system voice.

- Relational Hero: Source Serif 4 Medium, 30 sp standard, responsive 28–34 sp, 1.22–1.30 line height, `-0.1` letter spacing, maximum 86% safe width, centred, primary text color.
- Relational Secondary: Source Serif 4 Regular, 22 sp, 30 sp line height.
- Functional Primary: Source Sans 3 Medium, 17 sp, 23 sp line height.
- Functional Secondary: Source Sans 3 Regular, 15 sp, 21 sp line height.
- Functional controls retain at least a 44×44 logical target; Pebble uses 48 where practical.

Primary and secondary essential text exceed WCAG AA against the background edge; Relational Hero exceeds 7:1. Low contrast is never used as shorthand for premium design.

## Empty bowl

The empty bowl is complete, warm enough to read, and never a disabled state. The only default caption is “The bowl is empty.” / “A tál most üres.” in Relational Hero. It enters after a 340 ms settle delay over 420 ms, without blur, letter animation, icon, count, second line, CTA, or request for the partner to act.

## Neumorphism boundary

Neumorphism belongs to the physical objects, never to the application chrome. Depth, volume, contact shadow, reflected light, lift, and surface relief may shape the bowl and stones. Buttons, fields, cards, settings, navigation, and general surfaces remain flat and restrained—never embossed, inset, clay-like, glassmorphic, or Bento-styled.

## Environment and accessibility

Local-time morning, day, evening, and night states remain inside one bright-dark family. Night cannot crush the bowl or pebbles into black. Seasonal drift is secondary and never overrides minimum visibility. No location, weather, partner state, or network input is used.

The pebble gesture has screen-reader buttons with long-press transfer and tap-to-touch alternatives. Empty state is announced. Reduced motion, scalable typography, visible functional contrast, Safe Area layout, and a 2D fallback remain mandatory.

## Renderer and Expo GL boundary

One React Three Fiber native Canvas uses Expo GL, basic shadow maps, ACES tone mapping, sRGB output, exposure `1.12`, and pixel ratio capped at `1.35` (`1.0` in low-quality diagnostics). Three.js is pinned to r182 because current R3F 9.6.1 still constructs `Clock`; r183+ reports that internal dependency as deprecated. `npm ls` must resolve one deduplicated Three instance.

Expo GL does not implement every browser WebGL `pixelStorei` enum that Three calls while resetting renderer state. Pebble configures no textures and does not monkey-patch console or GL. Harmless initialization messages for unsupported reset-only enums may remain until Expo GL implements them; `UNPACK_FLIP_Y_WEBGL` and `UNPACK_ALIGNMENT` are supported. This limitation must never be hidden or mistaken for a missing-material failure.

The earlier Pebble repository contributed procedural deformation, deterministic variation, restrained rough materials, weighted lighting, contact grounding, and slow motion principles. DOM canvas textures, `window`, `document`, `ResizeObserver`, renderer DOM mounting, browser media queries, continuous spin/float, skins, patina progression, and relationship telemetry were not reused.

## Fallback and Bowl Lab

The responsive 2D fallback uses the same six roles, zero-through-six layouts, 74% centred bowl, bright-dark palette, tactile shadows, hold/cancel/departure behavior, and empty-state hierarchy. It is a product surface, not an unrelated placeholder.

The development-only Bowl Lab never accesses Supabase. It exposes counts zero through six, all identities, initial three, all six, empty, held/cancelled/departure/arrival/touched states, four times, seasons, maximum darkness, reduced motion, low-end quality, GL fallback, wireframe, unlit material, white light, bowl/pebble visibility, axes/camera diagnostics, Safe Area overlay, English/Hungarian, and large type. It reports projected width, side margin, bounds, camera distance, exposure, light intensities, frame activity, Canvas count, and active animation.

## Physical-device acceptance

Automated tests and Android export cannot certify visual success. A physical Android pass must confirm the entire bowl contour, horizontal centring, three visible distinct initial stones, restrained light temperature, perceptible pickup/cancel/departure/arrival, complete empty state, readable relational text, stable GL/fallback behavior, one renderer after repeated navigation, and no rapid thermal increase.

Permanent rules:

> Neumorphism belongs to the physical objects, never to the application chrome.

> Darkness may frame the objects, but it may never hide them.
