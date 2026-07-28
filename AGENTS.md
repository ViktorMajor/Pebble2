# Pebble Repository Instructions

## Mandatory reading

Before changing this repository, read:

1. [docs/PRODUCT_CONSTITUTION.md](docs/PRODUCT_CONSTITUTION.md)
2. [docs/DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md)
3. [docs/DECISION_LOG.md](docs/DECISION_LOG.md)
4. Relevant architecture and workflow documents

## Authority

The Product Constitution is authoritative. Do not implement a request that contradicts it without an explicit constitutional change instruction from the user.

The repository authority hierarchy is:

1. Product Constitution
2. Design Principles
3. Decision Log
4. Technical architecture documentation
5. Implementation code

When documents conflict, the higher item wins.

## Conflict handling

When a requested change appears to conflict with the Product Constitution:

1. Stop before implementing the conflicting part.
2. Identify the exact conflict.
3. Explain the product consequence.
4. Request an explicit user decision.
5. Do not silently reinterpret or weaken the constitution.

## Constitution change control

Routine feature, bug-fix, visual, refactor, and technical tasks must not edit `docs/PRODUCT_CONSTITUTION.md`.

Changing the constitution requires:

- explicit user approval;
- a dedicated task;
- a dedicated commit;
- a Decision Log entry;
- a clear explanation of consequences.

## Design-principle change control

A stable design principle may change only when the user explicitly approves the new direction, the Decision Log records why, and implementation details are not incorrectly promoted into immutable principles.

## Core invariants

Always preserve:

- exactly two members per connection;
- exactly six active pebbles;
- 3–3 initial distribution;
- persistent transferred identities;
- no chat;
- no partner inventory display;
- no gamification;
- no reciprocation pressure;
- a peaceful empty-bowl state;
- separation of connection closure and account deletion.

## Scope discipline

Do not redesign unrelated screens during a technical fix. Do not change product behavior during a documentation task. Prefer small, isolated, verifiable development steps.

## Verification language

Never claim that a visual defect is fixed unless the user verified it on a physical device. Use only:

- Implemented, not device-verified
- Device-verified by user
- Failed physical verification

## Native build discipline

State clearly when a change requires a new development APK. Do not trigger EAS builds unless explicitly requested.

## Security and repository hygiene

Never commit:

- `.env` files;
- secrets;
- credentials;
- Supabase keys;
- invitation tokens;
- LAN IP addresses;
- ADB keys;
- generated build output;
- unlicensed assets.

## Final reports

Every substantial task report must include:

- constitutional compliance;
- files changed;
- validation performed;
- physical verification status;
- native build impact;
- commit SHA;
- push status.
