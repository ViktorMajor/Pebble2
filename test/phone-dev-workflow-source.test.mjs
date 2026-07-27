import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const script = readFileSync(new URL('../scripts/start-phone-dev.sh', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../ANDROID_DEVELOPMENT_WORKFLOW.md', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('phone development launcher uses default-route source IP and process-scoped Supabase URL', () => {
  assert.match(script, /ip -4 route get 1\.1\.1\.1/);
  assert.match(script, /EXPO_PUBLIC_SUPABASE_URL="\$supabase_url"/);
  assert.match(script, /supabase start/);
  assert.match(script, /curl .*\$supabase_url\/rest\/v1/);
  assert.match(script, /expo start --dev-client --lan/);
  assert.match(script, /supabase functions serve/);
  assert.doesNotMatch(script, /\.env\.local|sed -i|SERVICE_ROLE/);
  assert.equal(packageJson.scripts['dev:phone'], 'bash scripts/start-phone-dev.sh');
});

test('portable workflow documents guest-network limitation and APK boundary', () => {
  assert.match(docs, /npm run dev:phone/);
  assert.match(docs, /client isolation/i);
  assert.match(docs, /--tunnel/);
  assert.match(docs, /does \*\*not\*\* require a new EAS APK/);
});
