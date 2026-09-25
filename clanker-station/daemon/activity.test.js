import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { activity, parseLines } from './activity.js';
import { emptyStats, updateStats } from './stats.js';
import { scan, enqueue, migrate, opaqueProjectKey } from './index.js';

test('only bounded activity scalars are derived from Pi messages', () => {
  const pulse = activity({ type: 'message', timestamp: '2026-09-24T00:00:00Z', message: { role: 'assistant', model: 'model', content: [{ type: 'text', text: 'SECRET DO NOT SEND' }] } }, 'session', 'project');
  assert.deepEqual(pulse, { type: 'pulse', sid: 'session', project: 'project', projectKey: '', at: '2026-09-24T00:00:00Z', kind: 'assistant', model: 'model' });
  assert.doesNotMatch(JSON.stringify(pulse), /SECRET|content/);
  const bytes = Buffer.from('{"value":"é"}\npartial');
  assert.deepEqual(parseLines(bytes.subarray(0, 13)).records.length, 0);
  assert.deepEqual(parseLines(bytes).records[0].value, { value: 'é' });
});
test('file totals count safe usage numbers, never content or tool arguments', () => {
  const stats = emptyStats();
  updateStats(stats, { type: 'message', message: { role: 'user', content: 'PRIVATE USER TEXT' } });
  updateStats(stats, { type: 'message', message: { role: 'assistant', content: [{ type: 'toolCall', name: 'exec', arguments: { secret: 'PRIVATE ARG' } }, { type: 'toolCall', name: 'read' }], usage: { input: 100, output: 20, cacheRead: 30, cacheWrite: 5, reasoning: 7, totalTokens: 162, cost: { total: 0.0123 } } } });
  updateStats(stats, { type: 'message', message: { role: 'toolResult', content: 'PRIVATE OUTPUT' } });
  assert.equal(stats.userMessages, 1); assert.equal(stats.assistantMessages, 1); assert.equal(stats.toolCalls, 2); assert.equal(stats.toolResults, 1);
  assert.equal(stats.totalTokens, 162); assert.equal(stats.inputTokens, 100); assert.equal(stats.usageRecords, 1);
  assert.equal(stats.pricedMessages, 1); assert.equal(stats.costUsd, 0.0123);
  assert.doesNotMatch(JSON.stringify(stats), /PRIVATE|secret|exec/);
});
test('v1 queue and cursors are discarded instead of uploading conversation content', () => {
  const old = { installationId: 'same-machine', queue: [{ payload: { text: 'SECRET' } }], files: { secret: { offset: 123 } }, seq: 98 };
  const state = migrate(old);
  assert.equal(state.installationId, old.installationId);
  assert.deepEqual(state.queue, []); assert.deepEqual(state.files, {});
  assert.doesNotMatch(JSON.stringify(state), /SECRET/);
  assert.equal(state.statsVersion, 1);
  const priorV2 = { version: 2, installationId: 'same-machine', projectSalt: 'local-salt', files: { stale: {} }, queue: [{ type: 'pulse', sid: 'old' }] };
  const upgraded = migrate(priorV2);
  assert.equal(upgraded.projectSalt, priorV2.projectSalt); assert.deepEqual(upgraded.queue, []);
  assert.equal(opaqueProjectKey('/private/one/workspace', state.projectSalt), opaqueProjectKey('/private/one/workspace', state.projectSalt));
  assert.notEqual(opaqueProjectKey('/private/one/workspace', state.projectSalt), opaqueProjectKey('/private/two/workspace', state.projectSalt));
  assert.doesNotMatch(opaqueProjectKey('/private/one/workspace', state.projectSalt), /private/);
});
test('multiple files, partial writes, truncation, and coalesced pulses', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'station-activity-'));
  const config = { roots: [root], lookbackDays: 1 }, state = { files: {}, queue: [], projectSalt: 'test-only-local-salt' };
  try {
    const first = path.join(root, 'a.jsonl'), second = path.join(root, 'b.jsonl');
    const header = id => JSON.stringify({ type: 'session', id, cwd: '/private/project' }) + '\n';
    await fs.writeFile(first, header('a') + JSON.stringify({ type: 'message', timestamp: new Date().toISOString(), message: { role: 'user', content: 'PRIVATE PROMPT' } }) + '\n');
    await fs.writeFile(second, header('b') + '{"type":"message","message":{"role":"assistant","content":"NOT FINISHED"');
    await scan(config, state);
    assert.equal(state.queue.length, 1); assert.equal(state.queue[0].project, 'project');
    assert.doesNotMatch(JSON.stringify(state.queue), /PRIVATE|NOT FINISHED|private/);
    await fs.appendFile(second, '}}\n'); await scan(config, state);
    assert.equal(state.queue.length, 2);
    await fs.appendFile(first, JSON.stringify({ type: 'message', timestamp: new Date(Date.now() + 1000).toISOString(), message: { role: 'assistant', content: 'ALSO PRIVATE', usage: { input: 30, output: 10, totalTokens: 40, cost: { total: 0.005 } } } }) + '\n');
    await scan(config, state);
    assert.equal(state.queue.length, 2); assert.equal(state.queue.find(x => x.sid === 'a').kind, 'assistant');
    assert.equal(state.queue.find(x => x.sid === 'a').stats.totalTokens, 40);
    assert.equal(state.queue.find(x => x.sid === 'a').stats.costUsd, 0.005);
    await fs.writeFile(first, header('a') + JSON.stringify({ type: 'message', message: { role: 'toolResult', content: 'SECRET RESULT' } }) + '\n');
    await scan(config, state);
    assert.doesNotMatch(JSON.stringify(state.queue), /SECRET RESULT/);
    enqueue(state, { type: 'pulse', sid: 'a', project: 'new', at: new Date().toISOString(), kind: 'message', model: '' }, 1);
    assert.equal(state.queue.length, 3, 'an in-flight record is not mutated');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
