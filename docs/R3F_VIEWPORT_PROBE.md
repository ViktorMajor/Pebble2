# R3F Viewport Probe

This development-only probe isolates `@react-three/fiber/native` Canvas sizing, Three.js renderer sizing, viewport/scissor state, and pointer coordinates. Open it through **Settings → Development → R3F Viewport Probe**. It does not use BowlScene, application data, Supabase, textures, shadows, or camera-fitting helpers.

## Verified baseline

- **Raw GLView Probe: Device-verified by user.** On the Redmi Note 14 Pro 5G, the raw `expo-gl` GLView measured 375.4 × 834.5 logical pixels, exposed a 1220 × 2712 drawing buffer, and filled the complete physical viewport with four direct WebGL quadrants.
- **R3F native DPR: Device-verified by user.** Default and Reset scissor used approximately 3.250 DPR, filled the complete viewport, and preserved correct pointer mapping.
- **R3F capped DPR 1.35: Failed physical verification.** Resync logical size and Resync drawing buffer produced an approximately 506 × 1126 renderer buffer inside the approximately 1220 × 2712 native surface and visibly reproduced the small left-aligned rectangle.
- **Source-informed native-DPR candidate: Device-verified by user.** It restored an approximately 1219 × 2712 renderer buffer and correct top-right pointer selection.
- **Production BowlScene repair: Device-verified by user.** Ordinary Bowl, Pairing hero, and Bowl Lab all fill their intended native viewport on the Redmi Note 14 Pro 5G.

## Installed native Canvas behavior

The installed implementation was inspected at:

- `node_modules/@react-three/fiber/native/dist/react-three-fiber-native.esm.js`
- `node_modules/@react-three/fiber/native/dist/react-three-fiber-native.cjs.dev.js`
- `node_modules/@react-three/fiber/dist/declarations/src/native/Canvas.d.ts`

R3F 9.6.1 renders an outer React Native `View` with `flex: 1`, measures that view with its own `onLayout`, then mounts an absolutely filled Expo `GLView`. On context creation it supplies Three.js with a canvas-like object whose width and height initially equal the Expo GL drawing buffer. It configures the R3F root with the measured logical size and `dpr: PixelRatio.get()`. The source explicitly notes that Expo GL renders at native DPR/resolution. The Canvas implementation overwrites a caller-provided `onLayout` on its outer View, so this probe also measures the Canvas native ref directly.

The physical probe established the exact failure chain. Expo GLView creates a native drawing buffer at approximately device DPR, and R3F native Canvas correctly initializes at that DPR. BowlScene then capped `WebGLRenderer.setPixelRatio()` to 1.35, causing Three.js to render approximately 506 × 1126 pixels into an approximately 1220 × 2712 native surface. The result was the small left-aligned rectangle. Preserving native surface DPR restores complete rendering and correct pointer coordinates.

## Pattern and pointer check

The probe uses an orthographic R3F scene containing red, green, blue, and yellow quadrants, a white outer border, and a white centre cross. Each quadrant is also a large R3F pointer target. A touch records the expected target, the selected object, received coordinates, and normalized device coordinates, and places a white marker at the hit point.

A repair is not safe merely because it fills the screen. All four pointer targets must also respond at their correct physical locations. Incorrect pointer mapping means the visual surface and R3F event coordinate system are no longer synchronized.

## Repair modes

- **Default:** leaves initial R3F native Canvas configuration untouched. Returning from another mode restores the captured baseline.
- **Reset scissor:** disables scissor testing and resets scissor and viewport to the renderer's current logical size.
- **Resync logical size:** deliberately applies the failed diagnostic 1.35 DPR, synchronizes the renderer to measured logical dimensions, and resets bounds.
- **Resync drawing buffer:** calculates the expected buffer from logical layout × 1.35 and applies it using Three.js pixel-ratio and logical-size semantics.
- **Source-informed candidate:** derives the native surface DPR from Expo GL drawing-buffer dimensions divided by measured layout dimensions, then synchronizes Three.js with that DPR and the logical Canvas size.

Changing modes, recording an observation, copying a report, or pressing **Rerender** does not remount Canvas. Mount, context, renderer, and disposal counters expose accidental lifecycle changes.

## Interpretation

### Outcome 1 — Default is small, one repair mode is full-screen

Expo GLView is healthy and R3F Canvas is mounted. Renderer viewport/scissor/size synchronization is the defect, and the successful mode is a candidate production repair. Confirm pointer accuracy before applying it.

### Outcome 2 — Every R3F mode remains small

The issue is likely in the internal native Canvas/GLView wrapper or native presentation. Renderer state repair is insufficient; a later task may need a custom explicit GLView-to-R3F bridge or controlled renderer replacement.

### Outcome 3 — This technical pattern fills the screen, BowlScene remains small

R3F Canvas itself is healthy. The defect is specific to BowlScene camera, atmosphere, viewport, render state, or composition code. Because the installed native Canvas already selects native DPR, the production capped-DPR call is the first isolated candidate to inspect.

### Outcome 4 — A repair fills the screen but pointers are wrong

Visual and event coordinate systems disagree. Do not apply that repair to production until pointer mapping is corrected.

## Physical procedure

1. Run `npm run dev:phone` and open the existing development build.
2. Open Settings → Development → R3F Viewport Probe.
3. Record Default, then test each repair mode without leaving the screen.
4. In every visually full mode, touch all four quadrants and confirm the white marker and expected/selected labels agree.
5. Select the matching observation and press **Copy report**.
6. Confirm mounts, contexts, and renderers remain at one while modes and observations change.

The production repair removes BowlScene's later DPR overrides, including the low-quality override. Low-quality diagnostics now reduce shadow-map cost without resizing the Three.js surface. Direct DPR reduction is unsafe in the current Expo GL architecture because it does not resize the underlying native drawing surface.

The native-surface repair for ordinary Bowl, Pairing, and Bowl Lab is now **Device-verified by user**. Subsequent visual changes, including smooth geometry and Pairing preview stones, retain their own verification status and must be confirmed separately.
