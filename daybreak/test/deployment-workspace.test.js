import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentWorkspace } from '../scripts/workspace.mjs';

const ownedTeam = { slug: 'aaa-owned-team', type: 'team', role: 'owner' };
const sharedTeam = { slug: 'bbb-shared-team', type: 'team', role: 'editor' };
const personal = { slug: 'zzz-personal', type: 'personal', role: 'owner' };
const identity = { workspaces: [ownedTeam, sharedTeam, personal] };

test('deployment defaults to the owned personal workspace, not the first membership', () => {
  assert.equal(deploymentWorkspace(identity), personal);
  assert.equal(deploymentWorkspace({ workspaces: [...identity.workspaces].reverse() }), personal);
});

test('configured team is selected explicitly, including editor memberships', () => {
  assert.equal(deploymentWorkspace(identity, ownedTeam.slug), ownedTeam);
  assert.equal(deploymentWorkspace(identity, sharedTeam.slug), sharedTeam);
});

test('removed or missing configured workspace never falls back to personal', () => {
  assert.throws(() => deploymentWorkspace(identity, 'removed-team'), /inaccessible.*No fallback/);
  assert.throws(() => deploymentWorkspace({ workspaces: [personal] }, sharedTeam.slug), /No fallback/);
});

test('missing, unauthorized or ambiguous personal defaults fail closed', () => {
  for (const me of [undefined, {}, { workspaces: [] }, { workspaces: [ownedTeam, sharedTeam] }, { workspaces: [{ ...personal, role: 'editor' }] }, { workspaces: [personal, { ...personal, slug: 'other-personal' }] }]) {
    assert.throws(() => deploymentWorkspace(me), /No unambiguous owned personal/);
  }
});

test('invalid explicit workspace settings fail instead of choosing a default', () => {
  for (const setting of ['', null, 42, 'UPPERCASE', 'a', 'with spaces', 'a'.repeat(33)]) {
    assert.throws(() => deploymentWorkspace(identity, setting), /Invalid workspace setting/);
  }
});
