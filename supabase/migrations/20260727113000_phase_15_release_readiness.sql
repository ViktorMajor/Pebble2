create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_display_name text := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if new_display_name is null then
    return new;
  end if;

  if char_length(new_display_name) > 80 then
    raise exception 'Display name is too long.';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, new_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_auth_user_insert
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();
