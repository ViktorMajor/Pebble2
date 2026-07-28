# Premium Bowl Art Direction

> **Authority notice:** This document records the current detailed implementation direction. Stable experience rules are defined by [Design Principles](DESIGN_PRINCIPLES.md), and immutable product identity is defined by the [Product Constitution](PRODUCT_CONSTITUTION.md). Exact tokens, dimensions, renderer choices, and timings below are mutable.

## Six circulating objects

Pebble is a private connection between exactly two people. A completed connection permanently owns exactly six physical-feeling pebble identities. Three begin with the creator and three with the joining member. They are created once, never regenerated, never reset, and never duplicated or destroyed while the connection is active. Sending transfers one specific identity; touching acknowledges its latest arrival without sending it back.

The user normally sees only their own bowl. The partner's present inventory is private because a comparison would turn presence into accounting. A person may hold any number from zero through six. There is no daily quota, cooldown, replenishment, automatic redistribution, numerical capacity, or debt language.

Existing Phase 17 development connections are migrated forward without rewriting transfer history. Two untouched provisional identities are retired deterministically, preferring one from each current holder. A retired row remains backend-auditable but cannot be selected, transferred, or returned by Bowl state. If fewer than two untouched identities are available, the connection is marked `legacy-six-migration-required` and transfers stop pending explicit review; the application never fabricates history to force a result.

## Luminous Mineral Space

The scene is an airy mineral environment, not a dark showroom. Premium quality comes from material depth, proportion, typography, light, spacing, and precise transitions rather than darkness. A cool upper mist moves through a pearl centre into a restrained warm-mineral base. The space is bright and optimistic without becoming clinical white, beige wellness styling, candy pastel, glassmorphism, or a decorative room.

Core tokens:

- Environment upper `#DCE6E5`, centre `#EEECE5`, lower `#E8DED2`, elevated surface `#F4F1EB`, secondary surface `#E4E8E4`, and border `#C8D0CB`.
- Bowl outer `#9B9D95`, inner `#B9B9AE`, rim `#D0CDC1`, contact `#747A75`, and reflected interior `#D2C4B5`.
- Primary text `#303937`, relational text `#343936`, essential secondary text `#424C48`, muted decorative text `#8B9490`, and accessible error `#743633`.
- Primary sage `#789287`, pressed sage `#667F75`, celadon `#AFC2B8`, warm accent `#D3B7A5`, and cool accent `#AABFC1`.
- Pebbles `#C8C2B5`, `#8FA097`, `#AA9588`, `#7F8B89`, `#D0CCC1`, and `#68716F`.

The warm and cool lights remain low-saturation neutral daylight. Their HSL saturation difference is capped below eight percentage points. Neither may read as orange, cyan, teal, purple, neon, or complementary-color spectacle. There is no black vignette.

Daytime lighting starts at ambient `1.25`, warm fill `0.75`, key `1.05`, rim `0.26`, and exposure `1.22`. The values stay within the prescribed broad-light ranges and are verified after tone mapping. Primary and essential functional text remain at least WCAG AA across every time stop; relational copy is dark graphite, never decorative low-contrast grey.

## Bowl and six identities

The bowl is a shallow hand-formed mineral/ceramic object with high roughness, zero metalness, restrained clearcoat, broad highlights, and a single vertex-colored mesh. A lighter upward-facing interior and readable rim replace overlapping front/back meshes, avoiding z-fighting while keeping the outside medium slate-grey.

Six stable visual roles combine a persisted seed with `visual_variant`: flatter pale mineral-grey, round warm grey, narrow graphite-grey, muted green-grey, softly marked medium-grey, and smaller light slate. Seeded deformation supplies fine individuality; the variant guarantees value and proportion separation. At least three roles are lighter than the bowl interior. The UI never names, ranks, catalogues, values, or assigns rarity to them.

Layouts zero through six are explicit. The initial three form a loose asymmetric triangle with visible bowl material between them. Every slot supplies position, rotation, scale, vertical offset, draw order, arrival origin, departure control point, and departure endpoint. Reduction from eight to six increases negative space, identity recognition, animation clarity, and deterministic test coverage without a physics engine.

## Composition and camera

The renderer uses a measured full-size architecture: a `width: 100%`, stretching, relative parent validates finite non-zero `onLayout` dimensions before creating Expo GL. Canvas and fallback then receive the same explicit absolute bounds. Physical probes later established that the former partial-width image was not a React Native layout failure: it was a renderer/native-buffer DPR mismatch.

The former “74%” diagnostic was misleading because it described the bowl relative to that undersized GL surface, not the phone's intended scene area. Metrics now report parent, Canvas, window, Safe Area, and aspect dimensions together. The camera uses the validated Canvas viewport. A 40-degree vertical perspective camera sits at a 41-degree downward angle. Distance is derived from the 3.84-world-unit bowl diameter and current horizontal field of view, targeting 74% of safe width. The acceptable normal range is 70–78%, never above 80%, with at least 24 logical pixels on each side; the margin constraint wins on exceptionally small viewports.

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

The sentence and bowl share one full-screen atmosphere: relational text is an overlay around 12% of usable height and never resizes the renderer. A complete connection with zero identities held by the caller is legitimately empty. A one-member connection has not yet provisioned its six identities and belongs in the invitation flow, while `legacy-six-migration-required` is a separate blocked diagnostic state. Pebble never fabricates stones to disguise any of these conditions.

## Neumorphism boundary

Neumorphism belongs to the physical objects, never to the application chrome. Depth, volume, contact shadow, reflected light, lift, and surface relief may shape the bowl and stones. Buttons, fields, cards, settings, navigation, and general surfaces remain flat and restrained—never embossed, inset, clay-like, glassmorphic, or Bento-styled.

## Environment and accessibility

Local-time morning, day, evening, and night states remain inside one luminous family. Morning is fresh cool mist over a pale warm centre; day is the clearest neutral state; evening introduces restrained lavender-grey and peach-mineral warmth; night bottoms out at medium-light pearl blue (`#AEBCC0`, `#C8CFCC`, `#C9BEB5`) rather than returning to charcoal. Seasonal drift is secondary and never overrides minimum visibility. No location, weather, partner state, or network input is used.

The pebble gesture has screen-reader buttons with long-press transfer and tap-to-touch alternatives. Empty state is announced. Reduced motion, scalable typography, visible functional contrast, Safe Area layout, and a 2D fallback remain mandatory.

## Renderer and Expo GL boundary

One React Three Fiber native Canvas uses Expo GL, basic shadow maps, ACES tone mapping, sRGB output, exposure `1.22`, and the native Expo GL surface DPR selected by R3F. Expo GL creates its native drawing surface at approximately device DPR; reducing only Three.js DPR leaves that native surface unchanged and renders into a partial lower-resolution viewport. Low-quality diagnostics therefore reduce shadow-map cost instead of renderer DPR. Three.js is pinned to r182 because current R3F 9.6.1 still constructs `Clock`; r183+ reports that internal dependency as deprecated. `npm ls` must resolve one deduplicated Three instance.

Expo GL does not implement every browser WebGL `pixelStorei` enum that Three calls while resetting renderer state. Pebble configures no textures and does not monkey-patch console or GL. Harmless initialization messages for unsupported reset-only enums may remain until Expo GL implements them; `UNPACK_FLIP_Y_WEBGL` and `UNPACK_ALIGNMENT` are supported. This limitation must never be hidden or mistaken for a missing-material failure.

The earlier Pebble repository contributed procedural deformation, deterministic variation, restrained rough materials, weighted lighting, contact grounding, and slow motion principles. DOM canvas textures, `window`, `document`, `ResizeObserver`, renderer DOM mounting, browser media queries, continuous spin/float, skins, patina progression, and relationship telemetry were not reused.

## Fallback and Bowl Lab

The responsive 2D fallback uses the same six roles, zero-through-six layouts, centred bowl, luminous palette, tactile shadows, hold/cancel/departure behavior, and empty-state hierarchy. It is a product surface, not an unrelated placeholder.

The development-only Bowl Lab is opened from Settings → Development; no ADB command is required. A full-width preview uses about 42% of portrait height with a 300-point minimum. A separate scrolling workbench groups pebble count, motion, lighting/season, collapsible renderer diagnostics and metrics, typography/accessibility, and connection inspection. Metrics no longer cover the bowl.

The Lab exposes counts zero through six, all identities, initial three, all six, empty, hold/cancel/departure/arrival/touched states, four times, seasons, maximum darkness, reduced motion, low-end quality, GL fallback, wireframe, unlit material, white light, bowl/pebble visibility, axes/camera diagnostics, Safe Area overlay, English/Hungarian, and large type. It reports real parent/Canvas/window bounds, Safe Area, projected width, side margin, camera distance, exposure, lights, frame activity, Canvas instances, renderer mounts, readiness, fallback, and active animation.

The optional development data inspector calls a member-only aggregate RPC. It shows pair/model status and active, caller-held, elsewhere-held, and retired counts without partner identity. It cannot write ownership or bypass RLS, and production navigation cannot expose the Lab.

The GL shader draws the luminous upper/centre/lower atmosphere directly across clip space, the renderer clear color matches the environment edge, and React Native/fallback layers use the same values. Loading and GL readiness therefore remain one continuous mineral surface without a black video-frame boundary.

## Navigation and connection ritual

All authenticated routes share one Pebble navigation shell. Bowl and Pairing display a small Pebble wordmark and an explicit localized Settings action; Settings and its subpages display a back action with a deterministic Bowl/Pairing fallback and a compact home shortcut. Native Expo Router headers are disabled so custom and system navigation never compete. Every target is at least 48 logical pixels, and development builds reserve top-right clearance for the unrelated Expo Dev Client tool button.

Pairing is a three-state ritual rather than a simultaneous form dashboard. The initial state shows one real bowl and only the create-invitation action plus a secondary join choice. The waiting state keeps the hero mounted, introduces a second real procedural bowl through a restrained opacity/depth transition, and prioritizes the selectable invitation, Copy, and Share; the alternate join form stays collapsed. The joining state presents one labeled keyboard-safe field, Join, and Cancel. Content moves only 12 pixels over 270 ms and becomes a direct crossfade when reduced motion is enabled.

Navigation and functional controls remain flat. Primary actions use muted sage, secondary actions use pearl/mineral borders, and inputs use light mineral surfaces with explicit focus state. Material relief belongs only to the physical bowl and pebbles.

## Physical-device acceptance

Automated tests and Android export cannot certify visual success. A physical Android pass must confirm the entire bowl contour, horizontal centring, three visible distinct initial stones, restrained light temperature, perceptible pickup/cancel/departure/arrival, complete empty state, readable relational text, stable GL/fallback behavior, one renderer after repeated navigation, and no rapid thermal increase.

Permanent rules:

> Neumorphism belongs to the physical objects, never to the application chrome.

> Light, material, and proportion create premium quality; darkness does not.
