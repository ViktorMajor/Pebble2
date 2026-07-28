# Product Guardrails

`npm test` includes targeted invariant checks in `test/product-guardrails.test.mjs`. They are intentionally narrower than a repository-wide word search:

- The migration check inspects the `public.pebbles` transfer-event table and the stable `public.pair_pebbles` identity model for forbidden authored-content, reaction, value/rarity, and read-tracking columns.
- The vocabulary check reads only `src/content/`, the home for reusable user-facing copy. It does not inspect internal logs or error messages.
- The structural check inspects only feature filenames under `src/features/` for messaging and engagement-oriented surfaces.

## Updating Rules

If `PRODUCT_INVARIANTS.md` changes, update the corresponding rule list in `test/product-guardrails.test.mjs` and this document in the same change. Add a focused test for the new product boundary. Do not weaken or remove an existing rule without an explicit product-invariant change and review.

New reusable user-facing copy belongs in `src/content/` so the vocabulary check covers it. Product-specific UI strings should be moved there when that UI is next materially changed.

Phase 18 source and database tests additionally assert the permanent six-pebble invariant, 3–3 provisioning, safe legacy retirement, no numerical inventory, no partner-bowl comparison, no user-facing Shore vocabulary, no badge count, no response prompt, and no full-interface neumorphism.
