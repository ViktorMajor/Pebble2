import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const provider = read('src/features/app/AppSessionProvider.tsx');
const root = read('app/index.tsx');
const shore = read('app/(app)/shore.tsx');
const pairing = read('app/(app)/pairing.tsx');
const auth = read('app/(auth)/_layout.tsx');

test('one provider resolves sign-in session and active shore before routing', () => {
  assert.match(provider, /useAuthSession\(\)/);
  assert.match(provider, /useCurrentShore\(auth\.session\?\.user\.id \?\? null\)/);
  assert.match(root, /appSession\.isLoading/);
  assert.match(root, /AppLoadingScreen/);
  assert.match(root, /appSession\.shoreId \? '\/\(app\)\/shore' : '\/\(app\)\/pairing'/);
});

test('route guards share stable state and always render loading or retry surfaces', () => {
  for (const source of [shore, pairing, auth]) {
    assert.match(source, /useAppSession/);
    assert.match(source, /AppLoadingScreen/);
  }
  assert.match(shore, /if \(!appSession\.shoreId\) return <Redirect href="\/\(app\)\/pairing"/);
  assert.match(pairing, /if \(appSession\.shoreId\) return <Redirect href="\/\(app\)\/shore"/);
  assert.match(pairing, /appSession\.isLoading/);
  assert.match(auth, /appSession\.session\) return <Redirect href=\{appSession\.shoreId/);
});
