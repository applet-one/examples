import path from 'node:path';

// Only these scalars may ever be persisted or transmitted. Never retain message.content.
export function activity(raw, sid, project, fallbackTime, projectKey = '', stats) {
  if (raw.type === 'session') return { sid: String(raw.id || sid).slice(0, 150), project: path.basename(raw.cwd || '') || project || 'Unknown project' };
  if (!raw.type || typeof raw.type !== 'string') return null;
  const at = typeof raw.timestamp === 'string' && !Number.isNaN(Date.parse(raw.timestamp)) ? raw.timestamp : fallbackTime;
  const kind = raw.type === 'message' ? String(raw.message?.role || 'message') : raw.type;
  const model = raw.type === 'model_change' ? raw.modelId : raw.message?.model;
  return { type: 'pulse', sid: String(sid).slice(0, 150), project: String(project || 'Unknown project').slice(0, 100), projectKey, at, kind: String(kind).slice(0, 40), model: typeof model === 'string' ? model.slice(0, 100) : '', ...(stats ? { stats: { ...stats } } : {}) };
}

export function parseLines(bytes, max = 65536) {
  const records = []; let start = 0, end;
  while ((end = bytes.indexOf(10, start)) !== -1) {
    const line = bytes.subarray(start, end); start = end + 1;
    if (line.length > max) { records.push({ error: 'oversized' }); continue; }
    try { records.push({ value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(line)) }); }
    catch { records.push({ error: 'malformed' }); }
  }
  return { records, consumed: start };
}
