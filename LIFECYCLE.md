# Pebble Lifecycle

## End a connection

Either current member can permanently end an active connection without the other member's approval. Ending it invalidates invitations and blocks new transfers, touches, and push delivery. Membership, the finite pebble identity set, and transfer history remain readable only to legitimate members as a static past connection. It cannot be reopened or edited.

A person may retain multiple past connections but may belong to at most one active connection. After ending one, they may begin another without deleting old history. Each completed new connection receives its own finite persistent pebble set.

## Delete an account

Account deletion remains an explicit protected Edge Function flow. The server first ends every active connection belonging to the requester, removes their push tokens, deletes their auth user, and removes empty connection records.

- The requester's auth record, profile, and memberships are deleted.
- Transfer events sent by the requester are removed through the existing membership foreign key; the other person's events remain.
- Stable pebble identities are not deleted merely because their current holder deletes an account. The holder reference becomes null, preserving the ended connection's integrity for a remaining member.
- Invitations created by the requester are removed.
- The requester's device tokens are removed before deletion and again by cascade.
- A connection with no remaining member is removed as inaccessible data minimization.

Pebble does not delete the other person's profile, membership, transfer events, push tokens, or unrelated connections.
