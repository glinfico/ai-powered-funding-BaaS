import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('admin sign-in keeps its existing private CCD destination', () => {
  const signIn = read('../../pages/fod/Portal.jsx');
  assert.match(signIn, /admin:\s*"\/crm\/dashboard"/);
});

test('existing protected CCD route mounts new dashboard but keeps old WSD in git', () => {
  const routes = read('../../App.jsx');
  assert.match(routes, /const ControlCenterDashboard = React\.lazy\(\(\) => import\("@\/pages\/crm\/ControlCenterDashboard"\)\)/);
  assert.match(routes, /path="\/crm\/dashboard"[^\n]+<CrmLayout><ControlCenterDashboard \/>/);
  assert.doesNotMatch(routes, /import\("@\/pages\/WorkspaceDashboard"\)/);
  assert.ok(read('../../pages/WorkspaceDashboard.jsx').includes('export default function WorkspaceDashboard'));
});
