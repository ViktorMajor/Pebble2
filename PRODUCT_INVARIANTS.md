# Pebble Product Invariants

Any implementation that violates these invariants is incorrect even if it satisfies another feature request.

P1. A connection contains exactly two people when complete and never more than two.

P2. A pebble contains no authored communication.

P3. Users cannot attach text, media, emoji or reactions to a pebble.

P4. Pebble never measures relationship quality.

P5. Pebble never measures reciprocity.

P6. Pebble never exposes response time.

P7. Pebble never exposes online presence.

P8. Inactivity is never framed negatively.

P9. Sending a pebble must be intentional but low-friction.

P10. A user can end a connection without the other person's approval.

P11. Users can access only data belonging to their own connections.

P12. Store no behavioral data that the product does not require.

P13. There must be no chat.

P14. There must be no streaks, scores, achievements or engagement mechanics.

P15. There must be no social feed or public profile system.

P16. Silence must never be interpreted by the application as relationship failure.

P17. A completed connection owns one finite persistent set of pebbles; sending transfers an existing identity between holders and never creates a new identity.

P18. Each person normally sees only their own bowl. Pebble never compares the two current inventories.

P19. An empty bowl is a complete state and never an engagement prompt.
