export const SOURCE = 'https://opendata.bonn.de/sites/default/files/ABFUHRTERMINE2026OpenData.csv';
export const SOURCE_PAGE = 'https://opendata.bonn.de/dataset/abfallplaner-m%C3%BCllabfuhrtermine-2026';
export const TYPES = {
  residual: { name: 'Restmüll', color: '#59666a' },
  bio: { name: 'Bioabfall', color: '#a17a51' },
  paper: { name: 'Papier', color: '#528fc3' },
  packaging: { name: 'Gelbe Tonne', color: '#d4ab35' },
  bulky: { name: 'Sperrmüll', color: '#967bb1' },
  green: { name: 'Grünabfall', color: '#688e57' },
  tree: { name: 'Weihnachtsbäume', color: '#2d7a67' }
};
export function category(label) {
  if (label.startsWith('Restmüll')) return 'residual';
  if (label.startsWith('Bio.')) return 'bio';
  if (label === 'Papier') return 'paper';
  if (label === 'LVP' || label === 'Gelbe Großbehälter') return 'packaging';
  if (label === 'Sperrmüll') return 'bulky';
  if (label === 'Grünabfallsammlung') return 'green';
  if (label === 'Weihnachtsbäume') return 'tree';
  return null;
}
// CSV parser handles quoted delimiters, embedded newlines and escaped quotes.
export function* parseCSV(text) {
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ';' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); if (row.some(Boolean)) yield row; row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); yield row; }
}
export function normalize(text, fetched = new Date().toISOString()) {
  const rows = parseCSV(text);
  const header = rows.next().value;
  const col = Object.fromEntries(header.map((s, i) => [s, i]));
  for (const required of ['STRASSE1', 'PLAN_BEZ', 'ID_TERMINE', 'TERMIN000']) if (!(required in col)) throw new Error('Unexpected Bonn CSV schema');
  const dateCols = header.map((s, i) => s.startsWith('TERMIN') ? i : -1).filter(i => i >= 0);
  const dates = [], sets = new Map(), streets = {};
  for (const row of rows) {
    const get = name => row[col[name]] || '';
    const type = category(get('PLAN_BEZ')); if (!type) continue;
    const ds = [...new Set(dateCols.map(i => row[i]).filter(s => /^\d{2}\.\d{2}\.2026$/.test(s || '')).map(s => s.split('.').reverse().join('-')))].sort();
    if (!ds.length) continue;
    const key = ds.join(',');
    if (!sets.has(key)) { sets.set(key, dates.length); dates.push(ds); }
    const street = get('STRASSE1');
    (streets[street] ||= []).push({ id: get('ID_TERMINE'), label: get('PLAN_BEZ'), type, frequency: get('AUFGTURNUS'), zip: get('PLZ1'), even: [get('HNR_GE_AB'), get('HNR_GE_BIS')], odd: [get('HNR_UG_AB'), get('HNR_UG_BIS')], excluded: get('HNR_NEG'), note: [get('STR_BEM1'), get('STR_BEM2')].filter(Boolean).join(' · '), dates: sets.get(key) });
  }
  if (Object.keys(streets).length < 1000) throw new Error('Incomplete Bonn data');
  return { fetched, year: 2026, streets, dates };
}
export function matches(row, house) {
  const n = parseInt(house, 10), normalized = house.replace(/\s/g, '').toUpperCase();
  if (!/^\d+[a-zA-Z]?$/.test(normalized) || !n) return false;
  if (row.excluded.split(/[,;]/).some(s => s.trim().replace(/\s/g, '').toUpperCase() === normalized)) return false;
  const [a, b] = n % 2 ? row.odd : row.even;
  return a !== '' && b !== '' && n >= Number(a) && n <= Number(b);
}
export function choices(data, street, house) {
  const rows = (data.streets[street] || []).filter(r => matches(r, house));
  // Equivalent records can occur for adjacent source segments: do not duplicate choices.
  return rows.filter((r, i) => rows.findIndex(x => x.type === r.type && x.label === r.label && x.frequency === r.frequency && x.dates === r.dates) === i);
}
export function events(data, selection) {
  const available = choices(data, selection.street, selection.house);
  const picked = available.filter(r => selection.ids.includes(r.id));
  const result = new Map();
  for (const row of picked) for (const date of data.dates[row.dates]) {
    const key = `${date}:${row.type}`;
    if (!result.has(key)) result.set(key, { date, type: row.type, name: TYPES[row.type].name });
  }
  return [...result.values()].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}
