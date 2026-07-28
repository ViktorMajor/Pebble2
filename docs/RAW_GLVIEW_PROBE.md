# Raw Expo GLView Probe

This development-only probe isolates Expo GLView from React Three Fiber, Three.js, BowlScene, camera fitting, and application data. Open it through **Settings → Development → Raw GLView Probe** in a development build. It renders four direct WebGL scissor quadrants and a white framebuffer boundary.

The observation buttons record the physical result locally for the current mounted screen only. They do not persist data or change the renderer.

## Result A — Raw GLView fills the screen

Conclusion: Expo GL works and the defect is inside the React Three Fiber native Canvas integration, style forwarding, or wrapper structure.

## Result B — Raw GLView remains a small rectangle

Conclusion: The defect is below React Three Fiber, in Expo GLView/native-view layout or the current Android runtime configuration.

## Result C — Layout is full size but quadrants are cropped

Conclusion: Native presentation size and GL drawing-buffer size disagree.

## Result D — GLView layout reports 0×0

Conclusion: The native GLView is not receiving a valid layout event or the measurement instrumentation is attached incorrectly.

## Comparison procedure

1. Run `npm run dev:phone` and open the existing development build.
2. Open Settings → Development → GL Layout Probe and record its measurements.
3. Return to Settings and open Raw GLView Probe.
4. Confirm all four React Native corner markers and the cyan GLView outline.
5. Record the GLView layout, drawing buffer, ratio, context ID, mount count, and context count.
6. Press **Rerender** and confirm the context and mount counts do not change.
7. Press **Remount** and confirm both mount and context creation counts increase once.
8. Select the matching A–D physical observation.

Status: **Device-verified by user.** Result A was confirmed on the Redmi Note 14 Pro 5G: the raw GLView and all four quadrants filled the complete physical viewport.
