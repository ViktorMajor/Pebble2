# Pebble Decision Log

This log records accepted product and stable-design decisions. It is subordinate to the [Product Constitution](PRODUCT_CONSTITUTION.md) and [Design Principles](DESIGN_PRINCIPLES.md). A log entry explains a decision; it cannot override a higher-authority document.

Use this template for future entries:

```markdown
## YYYY-MM-DD — Decision title

Status: Proposed | Accepted | Superseded

Decision:
...

Reason:
...

Consequences:
...

Constitutional impact: None | Design principle | Product constitution

Supersedes:
...
```

## 2026-07-28 — Exactly six persistent pebbles

Status: Accepted

Decision:
A completed connection owns exactly six persistent pebble identities. Three begin with the creator and three with the joining member. Pebbles are not created or reset after completion.

Reason:
A small closed set makes transfer of concrete identities—not message generation—the product’s central behavior.

Consequences:
Provisioning, ownership, transfer, migration, RLS, and UI state must preserve six active identities and the 3–3 initial allocation.

Constitutional impact: Product constitution

Supersedes:
Earlier provisional eight-pebble and 4–4 models.

## 2026-07-28 — Bowl replaces Shore

Status: Accepted

Decision:
Each person has a bowl. The relationship domain entity is a connection. Stable database names may retain historical Shore terminology when cosmetic renaming would add migration risk.

Reason:
The bowl directly represents the objects the current user holds and removes the implication of one jointly visible inventory space.

Consequences:
User-facing language uses Bowl and Connection. Internal legacy names do not redefine the product metaphor.

Constitutional impact: Product constitution

Supersedes:
The Shore user-facing metaphor.

## 2026-07-28 — Partner inventory remains private

Status: Accepted

Decision:
Users see their own bowl. Pebble does not show the partner’s current inventory or a side-by-side comparison.

Reason:
Inventory comparison would turn quiet presence into reciprocity accounting and behavioral monitoring.

Consequences:
Product projections, UI, diagnostics, and APIs must not expose partner-held identities in production.

Constitutional impact: Product constitution

Supersedes:
None.

## 2026-07-28 — Empty bowl is a complete state

Status: Accepted

Decision:
An empty bowl is peaceful and complete. It has no call to action, return pressure, or error framing.

Reason:
Silence and unequal temporary distribution are legitimate consequences of free, low-pressure circulation.

Consequences:
Empty-state copy and visuals may acknowledge emptiness but must not ask either person to act.

Constitutional impact: Product constitution

Supersedes:
Any missing-content or engagement framing for zero held pebbles.

## 2026-07-28 — No numeric notification badge

Status: Accepted

Decision:
Pebble does not set numeric badge counts or communicate a number of waiting pebbles. Platform-controlled neutral notification dots are acceptable.

Reason:
Counts create engagement pressure and turn relational presence into a queue.

Consequences:
Push payloads and client notification handling omit badge values and waiting counts.

Constitutional impact: Product constitution

Supersedes:
None.

## 2026-07-28 — Quiet optional sound

Status: Accepted

Decision:
Sound is optional and secondary to haptics. Only suitable real stone or ceramic recordings may ship. Reward tones and synthetic placeholders are prohibited; silence is acceptable when assets are unavailable.

Reason:
Sound should reinforce physical tactility without becoming an attention or reward mechanism.

Consequences:
The sound service defaults safely, prevents overlap, and may remain assetless until licensed recordings meet the brief.

Constitutional impact: Design principle

Supersedes:
None.

## 2026-07-28 — Luminous mineral visual direction

Status: Accepted

Decision:
Pebble’s visual direction is bright, cheerful, airy, tactile, mineral, and calm. Premium quality comes from material, light, typography, proportion, spacing, motion, and precision rather than darkness.

Reason:
The earlier dark-charcoal direction felt sombre and allowed insufficient object separation on a physical phone.

Consequences:
Current implementation should maintain a luminous environment while exact colors and lighting values remain mutable.

Constitutional impact: Design principle

Supersedes:
Dark-charcoal premium as a stable direction.

## 2026-07-28 — Object-only tactile relief

Status: Accepted

Decision:
The bowl and pebbles may be dimensional and tactile. Application controls and chrome remain flat.

Reason:
Physical relief supports the object metaphor; applying it to controls creates visual noise and style drift.

Consequences:
No neumorphic buttons, fields, cards, navigation, or settings rows.

Constitutional impact: Design principle

Supersedes:
None.

## 2026-07-28 — Serif relationship voice and sans-serif system voice

Status: Accepted

Decision:
Rare relational language uses a serif voice. Functional application language uses a sans-serif voice.

Reason:
Two voices distinguish emotional meaning from system operation without adding visual clutter.

Consequences:
Font families and sizes may change, but their semantic roles remain distinct.

Constitutional impact: Design principle

Supersedes:
None.

## 2026-07-28 — Three-level motion grammar

Status: Accepted

Decision:
Pebble motion has three levels: Rest, Touch, and Transfer.

Reason:
Motion must communicate physical state and persistent-object circulation, not decorate or reward.

Consequences:
Rest is stable, touch visibly lifts an object, and transfer preserves identity with damped mass. Reduced motion preserves state meaning.

Constitutional impact: Design principle

Supersedes:
Continuous decorative stone motion.

## 2026-07-28 — Physical-device visual verification terminology

Status: Accepted

Decision:
Visual work uses only “Implemented, not device-verified,” “Device-verified by user,” or “Failed physical verification.”

Reason:
Automated tests and theoretical layout calculations did not reveal defects later observed on the physical Android target.

Consequences:
No report may claim a physical visual defect is fixed without explicit user confirmation from the device.

Constitutional impact: Design principle

Supersedes:
Unqualified visual-completion claims based only on automated validation.

## 2026-07-28 — Development tools must be available in-app

Status: Accepted

Decision:
Bowl Lab and future development probes must be reachable from in-app development navigation without ADB and must never be visible in production.

Reason:
Physical-device diagnosis must remain accessible in the normal development workflow and distinct from Expo Dev Client tooling.

Consequences:
Development routes require explicit production guards and development-only Settings entries.

Constitutional impact: Design principle

Supersedes:
ADB-only access to visual development tools.
