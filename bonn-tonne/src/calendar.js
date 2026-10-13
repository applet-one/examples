import { SOURCE_PAGE } from './data.js';
const escape = s => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function fold(line) {
  const result = []; let current = '', bytes = 0;
  for (const c of line) {
    const size = new TextEncoder().encode(c).length;
    if (bytes + size > 75) { result.push(current); current = ' '; bytes = 1; }
    current += c; bytes += size;
  }
  result.push(current); return result.join('\r\n');
}
export function calendar(events, token, fetched) {
  const stamp = fetched.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//bonn-tonne//Bonn waste planner//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:bonn-tonne', 'X-WR-CALDESC:Daten: bonnorange AöR / Bonn Open Data · CC BY 4.0 · Für diesen Plan aufbereitet', 'X-WR-TIMEZONE:Europe/Berlin', 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H'];
  for (const e of events) {
    const next = new Date(e.date + 'T12:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    lines.push('BEGIN:VEVENT', `UID:${token}-${e.type}-${e.date}@bin-day`, `DTSTAMP:${stamp}`, `LAST-MODIFIED:${stamp}`, `DTSTART;VALUE=DATE:${e.date.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0,10).replaceAll('-', '')}`, `SUMMARY:${escape(e.name + ' · Abholung')}`, `DESCRIPTION:${escape('Offizieller Abfuhrtermin Bonn 2026. Keine Abholzeit angegeben. Bitte rechtzeitig bereitstellen.\nDaten: bonnorange AöR / Bonn Open Data. CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Für diesen Plan aufbereitet.\nQuelle: ' + SOURCE_PAGE)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
