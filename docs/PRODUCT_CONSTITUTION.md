# Pebble Product Constitution

This document defines the non-negotiable identity of Pebble. Every product decision, design principle, technical architecture, and implementation must comply with it.

The repository authority hierarchy is:

1. This Product Constitution
2. [Design Principles](DESIGN_PRINCIPLES.md)
3. [Decision Log](DECISION_LOG.md)
4. Technical architecture documentation
5. Implementation code

When documents conflict, the higher item in this hierarchy wins.

## Purpose

Pebble is a private, two-person relational presence application. Pebble is not a messenger.

Pebble allows one person to communicate one minimal relational signal to one specific other person: “I thought of you.” The Hungarian conceptual equivalent is “Gondoltam rád.”

Pebble must enable presence, affection, recognition, quiet connection, and low-pressure relational continuity. It intentionally avoids the semantic and social pressure created by text-based communication. Pebble must not attempt to replace conversation or relationship work.

## Core metaphor

Each person has a bowl. A completed connection owns one closed set of six persistent pebbles. The same concrete pebble identities circulate between the two bowls.

A pebble is not generated as a message. Sending means transferring an existing object. The guiding conceptual sentence is:

> Do not send a message. Transfer a concrete object that may later return.

The bowl represents what the current user presently holds. The user normally sees only their own bowl. The other person’s inventory remains private.

## Immutable product rules

1. A connection contains exactly two people. A pre-join invitation is an incomplete connection setup, not a completed relationship.
2. A completed connection contains exactly six active persistent pebbles.
3. Initial distribution is exactly 3–3.
4. Pebbles have stable identities.
5. Pebbles are transferred, never copied.
6. Pebbles are never generated after connection completion, earned, purchased, consumed, destroyed, reset, replenished, assigned rarity, converted into currency, or treated as collectible rewards.
7. Sending a pebble transfers ownership from the current holder to the other member.
8. Touching an incoming pebble acknowledges it.
9. Touching does not transfer the pebble back.
10. Touch state must not become relationship telemetry.
11. Exact touch timestamps must not be shown to either user.
12. Pebble must contain no chat, free text, partner-written message, image, video, voice message, emoji, reaction, comment, public feed, online status, typing status, or exact activity status.
13. Pebble must contain no daily quota, streak, score, achievement, level, leaderboard, engagement reward, response-time measurement, relationship-health score, or usage-performance metric.
14. The user must not see the partner’s current pebble inventory.
15. The interface must not compare the two users.
16. The application must not frame a pebble as something owed back.
17. The application must not remind or pressure the recipient to reciprocate.
18. Silence is a valid state.
19. An empty bowl is a complete and peaceful state.
20. The application must not treat an empty bowl as an error, missing content, inactivity, abandonment, a reason for a call to action, or a reason to prompt the partner.
21. Connection closure and account deletion are separate operations.
22. A connection may be closed unilaterally.
23. Closed relationships may retain appropriate private historical continuity without becoming a social feed or an archive of communication telemetry.
24. Pebble must never evaluate, diagnose, score, or interpret the relationship.
25. Pebble must not provide AI-generated relationship judgments or advice as part of the core product.

A future implementation may not weaken these rules through different terminology, indirect metrics, optional settings, notification design, or technical convenience.

## Privacy and autonomy

- Each person sees their own bowl.
- The partner’s inventory is not exposed.
- Pebble does not disclose exact behavioral timing.
- Pebble does not reveal online presence.
- Pebble does not expose response speed.
- Pebble does not turn reciprocity into accounting.
- No user should feel monitored by the other.
- The recipient retains complete freedom not to respond.
- The absence of a response must not trigger pressure mechanics.
- Relationship privacy is a product feature, not only a security implementation detail.

Pebble must enforce these principles in product behavior and in server-side security boundaries.

## Emotional philosophy

Pebble must be:

- quiet rather than urgent;
- intimate rather than performative;
- warm rather than sentimental;
- meaningful rather than verbose;
- continuous rather than engagement-driven;
- tactile rather than gamified;
- peaceful rather than empty;
- relational rather than analytical.

The application must not maximize time spent. A successful Pebble interaction may last only a few seconds. The product should leave a calm, warm impression without demanding further action.

## Prohibited product directions

Pebble must not evolve into:

- a messenger;
- a social network;
- a relationship dashboard;
- a gamified habit system;
- a partner-surveillance tool;
- a quantified relationship tracker;
- a virtual economy;
- a collectible-object game;
- a notification-driven engagement product;
- a therapeutic diagnostic system;
- an AI relationship coach;
- a content feed;
- a public profile platform.

Future features must be rejected when their primary value depends on more engagement, more notifications, more visible activity, partner comparison, response pressure, scarcity manipulation, reward loops, or monetized object variation.

## Constitutional change process

Routine feature, bug-fix, visual, refactor, and technical tasks may not edit this document.

A constitutional change requires all of the following:

1. Explicit user approval to change the constitution.
2. A dedicated task whose primary purpose is that constitutional change.
3. A clear explanation of product and implementation consequences.
4. A corresponding accepted entry in the [Decision Log](DECISION_LOG.md).
5. A dedicated commit that does not conceal the change among routine implementation work.

If a requested implementation conflicts with this constitution, work must stop on the conflicting part until the user makes an explicit constitutional decision. The conflict must not be silently reinterpreted, bypassed, or weakened.
