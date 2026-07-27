# Product Guardrails

`npm test` includes targeted invariant checks in `test/product-guardrails.test.mjs`. They are intentionally narrower than a repository-wide word search:

- The migration check inspects the `public.pebbles` table definition and later `ALTER TABLE` statements for forbidden authored-content, reaction, and read-tracking columns.
- The vocabulary check reads only `src/content/`, the home for reusable user-facing copy. It does not inspect internal logs or error messages.
- The structural check inspects only feature filenames under `src/features/` for messaging and engagement-oriented surfaces.

## Updating Rules

If `PRODUCT_INVARIANTS.md` changes, update the corresponding rule list in `test/product-guardrails.test.mjs` and this document in the same change. Add a focused test for the new product boundary. Do not weaken or remove an existing rule without an explicit product-invariant change and review.

New reusable user-facing copy belongs in `src/content/` so the vocabulary check covers it. Product-specific UI strings should be moved there when that UI is next materially changed.
