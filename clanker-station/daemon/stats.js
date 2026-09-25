// File-local aggregate only. Never copy message text, tool arguments or output.
export const fields = ['userMessages', 'assistantMessages', 'toolCalls', 'toolResults', 'usageRecords', 'pricedMessages', 'inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens', 'totalTokens', 'costUsd'];
export const emptyStats = () => Object.fromEntries(fields.map(key => [key, 0]));
const safe = (value, cap = 1e12) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(value, cap) : 0;
export function updateStats(stats, raw) {
  if (raw.type !== 'message' || !raw.message || typeof raw.message !== 'object') return stats;
  const m = raw.message;
  if (m.role === 'user') stats.userMessages++;
  if (m.role === 'toolResult') stats.toolResults++;
  if (m.role !== 'assistant') return stats;
  stats.assistantMessages++;
  if (Array.isArray(m.content)) stats.toolCalls += m.content.filter(item => item?.type === 'toolCall').length;
  const u = m.usage || {};
  if (m.usage && typeof m.usage === 'object') stats.usageRecords++;
  if (typeof (u.cost?.total ?? m.cost?.total) === 'number' && Number.isFinite(u.cost?.total ?? m.cost?.total) && (u.cost?.total ?? m.cost?.total) >= 0) stats.pricedMessages++;
  for (const [key, source] of [['inputTokens', 'input'], ['outputTokens', 'output'], ['cacheReadTokens', 'cacheRead'], ['cacheWriteTokens', 'cacheWrite'], ['reasoningTokens', 'reasoning'], ['totalTokens', 'totalTokens']]) stats[key] = Math.min(1e12, stats[key] + safe(u[source]));
  stats.costUsd = Math.min(1e8, stats.costUsd + safe(u.cost?.total ?? m.cost?.total, 1e8));
  return stats;
}
