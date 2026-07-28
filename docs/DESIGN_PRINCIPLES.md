# Pebble Design Principles

This document defines stable visual and interaction principles. It does not freeze implementation details. It is subordinate to the [Product Constitution](PRODUCT_CONSTITUTION.md) and authoritative over the [Decision Log](DECISION_LOG.md), technical documentation, and code.

## Design purpose

Pebble’s design must make a minimal relational signal feel tangible, calm, and complete. The interface should support the bowl and circulating pebbles without turning them into an inventory, reward system, or communication dashboard.

## Stable visual principles

- Pebble uses radical minimalism.
- The application interface steps back.
- The bowl and pebbles are the primary visual objects.
- The experience should feel cheerful, luminous, mineral, calm, airy, intimate, and premium.
- Premium quality comes from proportion, material, typography, light, spacing, motion, and precision.
- Premium quality must not depend on darkness.
- Physical objects may have tactile relief.
- Application chrome must remain restrained and flat.
- Neumorphic treatment belongs only to physical objects.
- Buttons, fields, cards, navigation, and settings rows must not use neumorphic treatment.
- The bowl must remain a complete visual object when empty.
- The six pebbles should retain persistent, recognizable identities.
- The interface must never resemble a game inventory.

## Object hierarchy

The intended hierarchy is:

1. Space and atmosphere
2. Bowl
3. Pebbles
4. Rare relational text
5. Functional controls

Traditional mobile UI must not compete with the bowl and pebbles. Minimalism must not make navigation or essential actions inaccessible. Functional clarity takes precedence over decorative purity.

## Typography voices

Pebble has two typographic voices.

The relational voice is serif, emotionally meaningful, and rare. It is used for onboarding statements, empty-bowl statements, connection transitions, closure moments, and other rare relational phrases. Serif represents the voice of the relationship.

The system voice is sans-serif and functional. It is used for navigation, buttons, labels, settings, input fields, errors, and technical status. Sans-serif represents the voice of the system.

Exact font families and sizes are implementation choices, not constitutional identity. Current preferred fonts may be documented in technical art direction without becoming immutable.

## Motion grammar

Pebble uses three motion levels: Rest, Touch, and Transfer.

### Rest

- Stones feel heavy and stable.
- Stones do not continuously spin, float, or pulse.
- Only restrained environmental drift is permitted.

### Touch

- A selected pebble visibly lifts.
- Its shadow separates.
- It rotates slightly.
- A restrained haptic response may confirm contact.
- Haptics must not repeat as pressure or reward.

### Transfer

- The same concrete pebble remains visually identifiable.
- Movement has mass and is damped.
- Motion has little or no overshoot.
- There is no bounce, sparkle, particle effect, or magical disappearance.
- On arrival, the same identity enters and settles while other pebbles calmly rearrange.
- Arrival is not a reward animation.

Reduced motion must preserve understandable state changes without relying on travel, rotation, or environmental motion.

## Empty-bowl treatment

The empty bowl is one of Pebble’s most important states. It must remain visually complete, calm, illuminated, meaningful, and non-urgent.

The empty bowl must not include warning colors, sad icons, missing-content illustrations, partner reminders, disabled-send clutter, numerical inventory information, or prompts to request a pebble.

Relational copy may state:

- Hungarian: “A tál most üres.”
- English: “The bowl is empty.”

This sentence must not imply failure, abandonment, or obligation.

## Navigation and application chrome

- Navigation must remain clearly identifiable as Pebble navigation.
- Navigation must not depend on Expo Dev Client controls.
- Settings must always remain reachable.
- Controls must respect Safe Area boundaries.
- Touch targets must remain accessible.
- Pebble should avoid heavy tab bars, card navigation, and dashboard chrome.
- Minimal navigation must not become hidden navigation.
- Essential features must not rely on undocumented gestures.

## Accessibility

- Interactive targets must be at least 44 by 44 logical pixels; 48 by 48 is preferred for primary navigation and actions.
- Essential text and controls must have adequate contrast.
- Layouts must support large text without hiding essential actions.
- Fonts and copy must support Hungarian diacritics, including ő, Ő, ű, and Ű.
- Reduced-motion behavior must preserve meaning.
- Interactive elements must have screen-reader labels and appropriate roles.
- Selected and disabled states must not rely on color alone.
- Fallback rendering must prevent blank screens when advanced rendering fails.
- Visual subtlety must never make the core interaction unreadable.

## Explicit style exclusions

Pebble should not use:

- Bento Grid;
- card-heavy dashboards;
- glassmorphism;
- strong neumorphic UI chrome;
- startup marketing layouts;
- neon or RGB lighting;
- fantasy effects;
- gamified particles or confetti;
- candy colors;
- childish illustration;
- generic beige wellness-spa styling;
- dark luxury styling;
- banking-app styling;
- productivity dashboard styling;
- social-feed styling.

## Mutable implementation details

The following remain changeable:

- exact colors and hex values;
- font family implementation;
- font sizes;
- margins and spacing;
- camera position;
- bowl scale;
- scene proportions;
- lighting intensity;
- animation duration;
- renderer technology;
- Expo GL usage;
- React Three Fiber usage;
- 2D fallback technique;
- component structure;
- navigation implementation;
- button shape;
- responsive breakpoints;
- database implementation details that preserve the Product Constitution.

These details may change freely when testing demonstrates a better implementation, provided the Product Constitution and stable design principles remain intact.

## Physical-device verification

Every visual implementation or defect report must use one of these statuses:

- Implemented, not device-verified
- Device-verified by user
- Failed physical verification

No automated test, screenshot simulation, Expo export, or theoretical layout calculation is sufficient to claim that a physical-device visual defect has been fixed. A defect becomes “Device-verified by user” only after explicit user confirmation based on the physical device.
