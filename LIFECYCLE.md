# Pebble Lifecycle

## Close A Shore

Either current member can close an active shore without the other member's approval. Closing is permanent for the shore: no new pebbles, touches, invitations, or push deliveries can be created. Existing pebbles remain visible to current members as a static memory. A closed shore remains in the member's view; the MVP intentionally has no separate hide control, because removing a membership would also change historical access.

## Delete An Account

Account deletion is explicit and requires confirmation in the app. The server closes every active shore belonging to the requester before deleting the account.

- The requesting user's auth record and profile are deleted.
- Their shore memberships are deleted.
- Their sent pebbles are deleted through the membership foreign key; pebbles sent by another member remain.
- Active shores are closed first. A remaining member retains the closed shore and their own historical pebbles.
- Invitations for the requester's shores, including invitations they created, are removed.
- The requester's device push tokens are removed before account deletion and again by foreign-key cascade.
- Empty shores with no remaining member are removed as inaccessible data minimization.

Pebble does not delete another person's profile, membership, pebbles, or push tokens when one user deletes their account.
