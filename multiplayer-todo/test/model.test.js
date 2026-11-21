import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, createMember, member, snapshot, mutate } from '../src/model.js';

function fixture() {
  const state = emptyState();
  const admin = createMember(state, 'Alex', 'admin-hash', true);
  const collaborator = createMember(state, 'Sam', 'sam-hash');
  return { state, admin, collaborator };
}
test('snapshots never expose hashes and only admin sees revoked members', () => {
  const { state, admin, collaborator } = fixture();
  const other = createMember(state, 'Jo', 'jo-hash');
  collaborator.linkToken = 'private-sam-link';
  other.linkToken = 'private-jo-link';
  assert.equal(snapshot(state, admin).members.find(m => m.id === collaborator.id).linkToken, 'private-sam-link');
  assert.ok(snapshot(state, collaborator).members.every(m => !('linkToken' in m)));
  mutate(state, admin, '/api/revoke', { id: collaborator.id });
  assert.equal(collaborator.linkToken, undefined);
  assert.ok(!snapshot(state, admin).members.find(m => m.id === collaborator.id).linkToken);
  assert.equal(member(state, 'sam-hash'), undefined);
  assert.equal(snapshot(state, admin).members.length, 3);
  assert.equal(snapshot(state, other).members.length, 2);
  assert.ok(!JSON.stringify(snapshot(state, admin)).includes('hash'));
});
test('everyone can create, edit, complete, assign, comment and delete', () => {
  const { state, admin, collaborator } = fixture();
  mutate(state, collaborator, '/api/tasks', { action: 'create', title: '  Plan a launch  ' });
  const task = state.tasks[0];
  assert.equal(task.title, 'Plan a launch');
  mutate(state, admin, '/api/tasks', { action: 'update', id: task.id, assignees: [collaborator.id, collaborator.id], completed: true, title: 'Ship it' });
  assert.deepEqual(task.assignees, [collaborator.id]);
  assert.equal(task.completed, true);
  mutate(state, collaborator, '/api/comments', { id: task.id, text: 'Looks good!', name: 'Spoofed admin', userId: admin.id });
  assert.equal(task.comments[0].name, 'Sam');
  assert.equal(task.comments[0].userId, collaborator.id);
  mutate(state, admin, '/api/revoke', { id: collaborator.id });
  assert.deepEqual(task.assignees, []);
  assert.equal(task.comments[0].name, 'Sam');
  mutate(state, admin, '/api/tasks', { action: 'delete', id: task.id });
  assert.deepEqual(state.tasks, []);
});
test('admin and validation boundaries', () => {
  const { state, admin, collaborator } = fixture();
  assert.throws(() => mutate(state, collaborator, '/api/revoke', { id: admin.id }), /Only the admin/);
  assert.throws(() => mutate(state, admin, '/api/revoke', { id: admin.id }), /cannot be revoked/);
  assert.throws(() => createMember(state, ' ', 'x'), /Name must/);
  assert.throws(() => mutate(state, admin, '/api/tasks', { action: 'create', title: 'x'.repeat(241) }), /Title must/);
  mutate(state, admin, '/api/tasks', { action: 'create', title: '<script>alert(1)</script>' });
  const id = state.tasks[0].id;
  assert.throws(() => mutate(state, admin, '/api/tasks', { action: 'update', id, completed: 1 }), /boolean/);
  assert.throws(() => mutate(state, admin, '/api/tasks', { action: 'update', id, assignees: ['missing'] }), /active collaborators/);
  assert.throws(() => mutate(state, admin, '/api/comments', { id, text: ' ' }), /Comment must/);
});
