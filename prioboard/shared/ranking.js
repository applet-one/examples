export function total(o) {
  return Object.values(o.dimensions).reduce((a, d) => a + d.score, 0);
}
// Manual pins occupy absolute positions; calculated ordering fills the gaps.
export function boardOrder(items, overrides = []) {
  const calculated = ranked(items);
  const pins = new Map(overrides.map((o) => [o.position, o]));
  const pinnedIds = new Set(overrides.map((o) => o.cluster_id));
  const remaining = calculated.filter(
    (row) => !pinnedIds.has(row.opportunity.cluster_id),
  );
  return calculated.map((_, index) => {
    const override = pins.get(index + 1);
    const row = override
      ? calculated.find(
          (row) => row.opportunity.cluster_id === override.cluster_id,
        )
      : remaining.shift();
    return { ...row, position: index + 1, override };
  });
}

export function ranked(items) {
  return [...items]
    .sort(
      (a, b) => total(b) - total(a) || a.cluster_id.localeCompare(b.cluster_id),
    )
    .map((o, i, all) => ({
      opportunity: o,
      rank:
        i > 0 && total(o) === total(all[i - 1])
          ? all.findIndex((x) => total(x) === total(o)) + 1
          : i + 1,
    }));
}
