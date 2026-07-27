create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique check (char_length(expo_push_token) between 20 and 255),
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index device_push_tokens_user_id_idx
on public.device_push_tokens (user_id);

create table public.pebble_push_deliveries (
  pebble_id uuid primary key references public.pebbles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.pebble_push_deliveries enable row level security;
revoke all on public.pebble_push_deliveries from anon, authenticated;

create function private.set_device_push_token_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger device_push_tokens_set_updated_at_before_update
before update on public.device_push_tokens
for each row
execute function private.set_device_push_token_updated_at();

alter table public.device_push_tokens enable row level security;

revoke all on public.device_push_tokens from anon, authenticated;
grant select, insert, update, delete on public.device_push_tokens to authenticated;

create policy device_push_tokens_select_own
on public.device_push_tokens
for select
to authenticated
using (user_id = auth.uid());

create policy device_push_tokens_insert_own
on public.device_push_tokens
for insert
to authenticated
with check (user_id = auth.uid());

create policy device_push_tokens_update_own
on public.device_push_tokens
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy device_push_tokens_delete_own
on public.device_push_tokens
for delete
to authenticated
using (user_id = auth.uid());
