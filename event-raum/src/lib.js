export const clean = v => typeof v === 'string' ? v.trim() : '';
export const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v)) && clean(v).length <= 254;
export const validDate = v => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;
export const money = cents => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export function quote(event, people, code = '', now = Date.now()) {
  if (!event || !Array.isArray(people) || !people.length || people.length > 10) throw new Error('Bitte 1 bis 10 Personen angeben.');
  if (!['member','guest'].includes(people[0]?.kind) || people.slice(1).some(p => p.kind !== (people[0].kind === 'member' ? 'companion' : 'guest'))) throw new Error('Ungültige Zusammenstellung der Ticketkategorien.');
  const early = event.early_until && now < Date.parse(event.early_until);
  const discount = clean(code).toUpperCase();
  if (discount && (!event.discount_code || discount !== event.discount_code.toUpperCase())) throw new Error('Dieser Rabattcode ist nicht gültig.');
  const lines = people.map(p => {
    if (!['member', 'guest', 'companion'].includes(p.kind)) throw new Error('Ungültige Ticketkategorie.');
    const regular = event[p.kind + '_price'];
    const earlyPrice = event['early_' + p.kind + '_price'];
    const price = early && Number.isInteger(earlyPrice) ? earlyPrice : regular;
    if (!Number.isInteger(price) || price < 0) throw new Error('Preis nicht verfügbar.');
    return { kind: p.kind, price };
  });
  const subtotal = lines.reduce((sum, x) => sum + x.price, 0);
  const discountCents = discount ? Math.round(subtotal * event.discount_percent / 100) : 0;
  return { lines, subtotal, discount: discountCents, total: subtotal - discountCents, early: !!early };
}
export function canCancel(startsAt, now = Date.now()) { return Date.parse(startsAt) - now >= 48 * 60 * 60 * 1000; }
