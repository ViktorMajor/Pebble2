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
- Bowl outer `#8F928B`, upper inner wall `#B1AFA3`, lower cavity `#96988F`, rim `#C5C1B5`, and lower-wall transition `#858A83`.
- Primary text `#303937`, relational text `#343936`, essential secondary text `#424C48`, muted decorative text `#8B9490`, and accessible error `#743633`.
- Primary sage `#789287`, pressed sage `#667F75`, celadon `#AFC2B8`, warm accent `#D3B7A5`, and cool accent `#AABFC1`.
- Pebbles use an earthier mineral family: warm limestone `#9B9285`, greyed moss `#718078`, fired clay-grey `#8E6F61`, cool slate `#596766`, taupe sandstone `#A18D70`, and mineral graphite `#4E5958`. These replace the former pale cream/peach/sage grouping, which merged into candy-like clusters on a physical phone.

The warm and cool lights remain low-saturation neutral daylight. Their HSL saturation difference is capped below eight percentage points. Neither may read as orange, cyan, teal, purple, neon, or complementary-color spectacle. There is no black vignette.

Daytime lighting starts at ambient `1.25`, warm fill `0.75`, key `1.05`, rim `0.26`, and exposure `1.22`. The values stay within the prescribed broad-light ranges and are verified after tone mapping. Primary and essential functional text remain at least WCAG AA across every time stop; relational copy is dark graphite, never decorative low-contrast grey.

## Bowl and six identities

The bowl is a low, substantial hand-formed mineral/ceramic vessel with high roughness, zero metalness, restrained clearcoat, broad highlights, and a single vertex-colored mesh. Its lathe profile runs from an inner floor at `-0.24` to an inner rim at `0.66`, producing `0.90` world units of cavity depth and a `0.15` world-unit rim transition. A narrower interior floor, gently rising wall, lighter upper interior, darker lower cavity, and readable rim replace the former plate-like profile without becoming a flowerpot or steep soup bowl.

Six stable visual roles combine a persisted seed with `visual_variant`: warm limestone, moss mineral, fired clay-grey, slate, sandstone, and graphite. Seeded deformation supplies fine individuality; the variant guarantees value, shape, and surface-response separation. Layout assignment follows the fixed variant order `0, 5, 4, 3, 2, 1`, distributing light/dark and warm/cool identities across foreground and background slots rather than grouping similar stones. This ordering is a rendering concern only: the UI never names, ranks, catalogues, values, or assigns rarity to them.

The standard renderer uses detail-3 icosahedral source geometry. Deterministic deformation is deliberately broad and shallow; obsolete normals and UVs are removed, equivalent positions are welded into shared vertices, and smooth normals and finite bounds are recomputed. This preserves recognizable asymmetry without a faceted crystal or low-poly silhouette. Identity roughness stays within `0.80–0.90` (seed variation is capped at `0.91`), clearcoat within `0.007–0.027`, and clearcoat roughness within `0.84–0.96`.

Each identity acquires a deterministic, generated `64×64` tangent-space normal `DataTexture`. Low-contrast periodic multi-scale noise breaks up broad synthetic highlights without changing the silhouette or animating/shimmering. Textures are cached by persistent seed and variant, reference-counted, and disposed when their last visual consumer unmounts. One base texture uses 16 KiB before mip overhead; six concurrently mounted identities use 96 KiB of base texture data (approximately 128 KiB including a complete mip chain). A restrained `2–3.8%` sheen response supplies roughness-modulated grazing separation rather than a white outline or glow. Ordinary resting stones have no emissive response; only the existing incoming state remains faintly distinguished.

Standard detail-3 pebble geometry measures 162 welded vertices and 320 triangles per identity; the 72-segment bowl measures 876 vertices and 1,584 triangles. A cold local diagnostic creation of six stone geometries, the bowl, and six micro-normal textures took about 138 ms on the development laptop; this is an engineering baseline, not a physical-Android render-time claim. Releasing all six handles returns the texture cache to zero entries. No allocation occurs per frame.

Every stone owns two inexpensive, non-raycast radial shader planes. A small identity-proportional contact core uses `0.17` maximum opacity directly beneath the footprint; a larger penumbra uses `0.06` maximum opacity. Both use warm mineral-grey rather than black, rotate with the slot, and stay at the resting contact plane while the visible stone lifts. This prevents one shared grey blob while retaining physical weight. The development-only low-quality mode uses detail 2 and smaller shadow maps; it never reduces the native renderer DPR.

Before a connection is complete, Pairing may show three deterministic presentational stones—limestone, clay-grey, and sage—in the primary bowl. They use the same visual geometry and material component as owned pebbles but are a separate `PreviewPebbleSpec`: they are not ownership records, are never persisted, counted, transferred, touched, announced as controls, or passed to Supabase. Initial and join states show these three stones in one bowl. The invitation-waiting state keeps the same three stones only in the primary bowl while the lower-contrast secondary bowl remains empty.

Layouts zero through six remain explicit and hand-authored: one is slightly off-centre, two form a diagonal, three an open triangle, four a stable asymmetric diamond, five an open ring, and six two shallow staggered rows. The full inner surface is used instead of a central pile. Every slot supplies position, rotation, scale, restrained Y layering, deterministic draw order, arrival origin, departure control point, and departure endpoint. The six-stone Y range is `0.14` world units; neighboring steps are generally `0.03–0.07`. The projected-footprint estimator reports a maximum overlap fraction of `0.142` for five and `0` for six, below the `0.20` resting target. These are deterministic engineering checks, not substitutes for physical visual approval.

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

Expo GL does not implement every browser WebGL `pixelStorei` enum that Three calls while resetting renderer state. Pebble now uses only locally generated normal `DataTexture` instances for microscopic stone response; it uses supported wrapping/filtering semantics and does not monkey-patch console or GL. Harmless initialization messages for unsupported reset-only enums may remain until Expo GL implements them; `UNPACK_FLIP_Y_WEBGL` and `UNPACK_ALIGNMENT` are supported. This limitation must never be hidden or mistaken for a missing-material failure.

The earlier Pebble repository contributed procedural deformation, deterministic variation, restrained rough materials, weighted lighting, contact grounding, and slow motion principles. DOM canvas textures, `window`, `document`, `ResizeObserver`, renderer DOM mounting, browser media queries, continuous spin/float, skins, patina progression, and relationship telemetry were not reused.

## Fallback and Bowl Lab

The responsive 2D fallback uses the same six roles, zero-through-six layouts, centred bowl, luminous palette, tactile shadows, hold/cancel/departure behavior, and empty-state hierarchy. It is a product surface, not an unrelated placeholder.

The development-only Bowl Lab is opened from Settings → Development; no ADB command is required. A full-width preview uses about 42% of portrait height with a 300-point minimum. A separate scrolling workbench groups pebble count, motion, lighting/season, collapsible renderer diagnostics and metrics, typography/accessibility, and connection inspection. Metrics no longer cover the bowl.

The Lab exposes counts zero through six, all identities, initial three, all six, empty, hold/cancel/departure/arrival/touched states, four times, seasons, maximum darkness, reduced motion, standard-smooth/detail-3 and low-quality/detail-2 geometry, GL fallback, wireframe, unlit material, neutral white light, bowl/pebble visibility, axes/camera diagnostics, Safe Area overlay, English/Hungarian, and large type. Its collapsible Object material inspection section isolates flat color, micro-normal, edge reflection, contact core, and penumbra. It reports the selected identity's roughness, clearcoat, seed, luminance, assigned slot/Y, shadow footprints, and texture-cache allocation alongside the existing renderer metrics.

The optional development data inspector calls a member-only aggregate RPC. It shows pair/model status and active, caller-held, elsewhere-held, and retired counts without partner identity. It cannot write ownership or bypass RLS, and production navigation cannot expose the Lab.

The GL shader draws the luminous upper/centre/lower atmosphere directly across clip space, the renderer clear color matches the environment edge, and React Native/fallback layers use the same values. Loading and GL readiness therefore remain one continuous mineral surface without a black video-frame boundary.

## Navigation and connection ritual

All authenticated routes share one Pebble navigation shell. Bowl and Pairing display a small Pebble wordmark and an explicit localized Settings action; Settings and its subpages display a back action with a deterministic Bowl/Pairing fallback and a compact home shortcut. Native Expo Router headers are disabled so custom and system navigation never compete. Every target is at least 48 logical pixels, and development builds reserve top-right clearance for the unrelated Expo Dev Client tool button.

Pairing is a three-state ritual rather than a simultaneous form dashboard. The initial state shows one real bowl and only the create-invitation action plus a secondary join choice. The waiting state keeps the hero mounted, introduces a second real procedural bowl through a restrained opacity/depth transition, and prioritizes the selectable invitation, Copy, and Share; the alternate join form stays collapsed. The joining state presents one labeled keyboard-safe field, Join, and Cancel. Content moves only 12 pixels over 270 ms and becomes a direct crossfade when reduced motion is enabled.

Navigation and functional controls remain flat. Primary actions use muted sage, secondary actions use pearl/mineral borders, and inputs use light mineral surfaces with explicit focus state. Material relief belongs only to the physical bowl and pebbles.

## Physical-device acceptance

Automated tests and Android export cannot certify visual success. The native-surface viewport repair and smooth detail-3 geometry are **Device-verified by user** on the Redmi Note 14 Pro 5G. The former material separation is **Failed physical verification** because five and six stones merged into a pastel, plastic-looking cluster and the bowl read as a plate. The mineral separation and deeper-bowl refinement is **Implemented, not device-verified** until the user confirms it on that phone.

Physical acceptance must inspect three, five, and six stones in Bowl Lab. Three must form a balanced, seated, instantly countable triangle. Five must remain individually countable without a central cluster or more than roughly 20% occlusion. Six must be countable within one second, retain a contour arc for every identity, alternate light/dark and warm/cool roles, show individual contact cores, and leave visible interior material. The bowl must show a real cavity, inner wall, finite rim thickness, and a luminous floor deeper than its rim. Materials must show no candy palette, repeated plastic highlight, white outline, visible high-frequency noise, or merged global shadow. Physical approval also confirms demand rendering, native DPR coverage, interaction, and stable renderer lifecycle.

Permanent rules:

> Neumorphism belongs to the physical objects, never to the application chrome.

> Light, material, and proportion create premium quality; darkness does not.
