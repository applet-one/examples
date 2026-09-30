import type { Locator, Page } from '@playwright/test';

export const origin = 'http://127.0.0.1:8795';
export const disclosure = 'Local demo · fictional entries · not medical advice';
export const note = 'Sample entry: steady pace.';

// Recent Monday in the same timezone as the browser; both starter exercises are due.
export function recentMonday() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (name: string) => parts.find(item => item.type === name)!.value;
  const day = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}

// Recorder-only presentation: fit cards/disclosure without covering bottom navigation.
// Installed on about:blank and again after navigation/reload; no app source is changed.
export async function mobilePresentation(page: Page) {
  const css = `
    html #__demo-layer .demo-note { left:12px; right:12px; max-width:none; padding:7px 10px; font-size:11px; }
    html #__demo-layer .demo-note.note-bottom { bottom:84px; }
    html #__demo-layer .demo-card { padding:24px; }
    html #__demo-layer .demo-card h1 { font-size:36px; line-height:1.14; max-width:100%; text-wrap:balance; }
    html #__demo-layer .demo-card p { font-size:20px; line-height:1.35; }
  `;
  await page.addInitScript(content => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = content;
      document.head.append(style);
    }, { once: true });
  }, css);
  await page.addStyleTag({ content: css });
}

// Keep interaction/results between the disclosure and fixed phone navigation.
export async function center(locator: Locator) {
  await locator.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
}
