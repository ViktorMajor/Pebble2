#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

fail() { printf 'Pebble phone development: %s\n' "$1" >&2; exit 1; }

[[ -f .env ]] || fail 'Missing .env. Copy .env.example and add only public local development values.'
grep -q '^EXPO_PUBLIC_SUPABASE_ANON_KEY=.' .env || fail 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.'
grep -q '^EXPO_PUBLIC_EAS_PROJECT_ID=.' .env || fail 'Missing EXPO_PUBLIC_EAS_PROJECT_ID in .env.'
command -v ip >/dev/null || fail 'The ip command is required to detect the active LAN route.'
command -v supabase >/dev/null || fail 'Supabase CLI is required.'
command -v curl >/dev/null || fail 'curl is required for LAN preflight checks.'

# Ask the kernel which source address it would use for the default internet route.
# This avoids Docker, loopback, and inactive adapters returned by hostname -I.
lan_ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '/src/ { for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
if [[ -z "$lan_ip" ]]; then
  default_device="$(ip -4 route show default 2>/dev/null | awk '/default/ { for (i = 1; i <= NF; i++) if ($i == "dev") { print $(i + 1); exit } }')"
  [[ -n "$default_device" ]] && lan_ip="$(ip -4 -o addr show dev "$default_device" scope global | awk 'NR == 1 { split($4, parts, "/"); print parts[1] }')"
fi
[[ "$lan_ip" =~ ^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.) ]] || fail 'No usable private LAN IPv4 was detected from the default route.'

supabase_url="http://${lan_ip}:54321"
printf 'Pebble phone development\nLAN IP: %s\nMetro: http://%s:8081\nSupabase: %s\n' "$lan_ip" "$lan_ip" "$supabase_url"

# This process-scoped export overrides the stale URL that Expo reads from .env.
# It preserves the anon key and EAS project ID in the ignored .env file.
export EXPO_PUBLIC_SUPABASE_URL="$supabase_url"

if ! supabase status >/dev/null 2>&1; then
  printf 'Starting local Supabase…\n'
  supabase start
fi

if ! curl --fail --silent --show-error --max-time 5 "$supabase_url/rest/v1/" >/dev/null; then
  printf 'Restarting local Supabase services…\n'
  supabase start
  curl --fail --silent --show-error --max-time 5 "$supabase_url/rest/v1/" >/dev/null || fail "Supabase is not reachable at ${supabase_url}. Check Docker and firewall access to port 54321."
fi

# Serve both local functions when no dedicated local function process exists.
if ! pgrep -f '[s]upabase functions serve' >/dev/null 2>&1; then
  mkdir -p .expo
  printf 'Starting local Edge Functions…\n'
  nohup supabase functions serve >.expo/pebble-edge-functions.log 2>&1 &
fi

printf 'Starting Metro in development-client LAN mode…\n'
exec npx expo start --dev-client --lan
