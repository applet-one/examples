export const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f6f5f1" />
    <meta
      name="description"
      content="OOOh! — Out of Office. In good hands. A little team-built tool for time away. Plan absences, see who's around, and leave a thoughtful handover. A fictional workplace demo built with Applet."
    />
    <title>OOOh! — Out of Office. In good hands.</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/style.css" />
    <script defer src="/app.js"></script>
  </head>
  <body>
    <div id="app">
      <div class="initial-loading">
        <span class="brand-mark" aria-hidden="true">O</span>
        <p>Making room for time away…</p>
      </div>
    </div>
    <div id="modal-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>
    <noscript
      >This planner needs JavaScript. Enable it to explore the fictional team demo.</noscript
    >
  </body>
</html>
`;
