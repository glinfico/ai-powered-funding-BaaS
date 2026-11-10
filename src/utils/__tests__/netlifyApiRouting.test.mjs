import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const redirects = readFileSync(new URL('../../../public/_redirects', import.meta.url), 'utf8')
  .split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));

test('Render API proxy is the first published Netlify rule', () => {
  assert.match(redirects[0], /^\/api\/\*\s+https:\/\/ai-powered-funding-baas\.onrender\.com\/api\/:splat\s+200!$/);
  assert.match(redirects[1], /^\/\*\s+\/index\.html\s+200$/);
});
