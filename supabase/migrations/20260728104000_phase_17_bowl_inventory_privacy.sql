-- A member sees only their own bowl. The secure transfer/touch functions still
-- validate the complete connection set internally.
drop policy pair_pebbles_select_for_members on public.pair_pebbles;
create policy pair_pebbles_select_own_bowl
on public.pair_pebbles for select to authenticated
using (
  private.is_pair_member(pair_pebbles.pair_id,auth.uid())
  and pair_pebbles.current_holder_id=auth.uid()
);
