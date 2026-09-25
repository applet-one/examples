// Synthetic showcase only. These records never enter the owner's database or daemon queue.
const usage = (totalTokens, userMessages, assistantMessages, toolCalls, costUsd) => ({
  userMessages, assistantMessages, toolCalls, toolResults: toolCalls,
  usageRecords: assistantMessages, pricedMessages: assistantMessages,
  inputTokens: Math.round(totalTokens * .62), outputTokens: Math.round(totalTokens * .22),
  cacheReadTokens: Math.round(totalTokens * .13), cacheWriteTokens: Math.round(totalTokens * .03),
  reasoningTokens: 0, totalTokens, costUsd,
});

const machineNames = { 'demo-atlas': 'Atlas · research worker', 'demo-forge': 'Forge · build worker', 'demo-glass': 'Glass · review worker' };
const session = (daemon_id, sid, project, projectKey, minutesAgo, kind, model, totalTokens, userMessages, assistantMessages, toolCalls, costUsd) => ({
  daemon_id, sid, project, projectKey, minutesAgo, kind, model, machine: machineNames[daemon_id],
  stats: usage(totalTokens, userMessages, assistantMessages, toolCalls, costUsd),
});

export const demoSnapshot = {
  archived: false,
  daemons: [
    { id: 'demo-atlas', name: 'Atlas · research worker', status: 'offline', mode: 'sample activity', backlog: 0, heartbeat: null, last_error: '' },
    { id: 'demo-forge', name: 'Forge · build worker', status: 'offline', mode: 'sample activity', backlog: 0, heartbeat: null, last_error: '' },
    { id: 'demo-glass', name: 'Glass · review worker', status: 'offline', mode: 'sample activity', backlog: 0, heartbeat: null, last_error: '' },
  ],
  agents: [
    session('demo-atlas', 'demo-atlas-01', 'market-map', '111111111111111111111111', 3, 'assistant', 'research-model', 1840, 3, 5, 2, 0.008),
    session('demo-atlas', 'demo-atlas-02', 'market-map', '111111111111111111111111', 32, 'assistant', 'research-model', 13200, 11, 18, 6, 0.064),
    session('demo-atlas', 'demo-atlas-03', 'field-notes', '222222222222222222222222', 230, 'toolResult', 'research-model', 58000, 18, 27, 14, 0.29),
    session('demo-atlas', 'demo-atlas-04', 'field-notes', '222222222222222222222222', 2000, 'assistant', 'research-model', 340, 1, 2, 0, 0.002),
    session('demo-forge', 'demo-forge-01', 'clanker-station', '333333333333333333333333', 1, 'assistant', 'build-model', 224000, 63, 91, 48, 1.83),
    session('demo-forge', 'demo-forge-02', 'clanker-station', '333333333333333333333333', 74, 'assistant', 'build-model', 27200, 15, 21, 9, 0.19),
    session('demo-forge', 'demo-forge-03', 'component-lab', '444444444444444444444444', 810, 'assistant', 'build-model', 7400, 6, 9, 5, 0.05),
    session('demo-forge', 'demo-forge-04', 'component-lab', '444444444444444444444444', 11000, 'user', 'build-model', 920, 2, 3, 0, 0.004),
    session('demo-glass', 'demo-glass-01', 'release-checklist', '555555555555555555555555', 12, 'assistant', 'review-model', 48000, 24, 31, 17, 0.32),
    session('demo-glass', 'demo-glass-02', 'release-checklist', '555555555555555555555555', 155, 'assistant', 'review-model', 6300, 5, 8, 3, 0.035),
    session('demo-glass', 'demo-glass-03', 'docs-site', '666666666666666666666666', 1500, 'assistant', 'review-model', 19500, 10, 16, 7, 0.12),
    session('demo-glass', 'demo-glass-04', 'docs-site', '666666666666666666666666', 23500, 'assistant', 'review-model', 1600, 2, 4, 1, 0.009),
  ],
};
