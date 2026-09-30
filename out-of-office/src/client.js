export const client = String.raw`(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const app = $('#app');
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h2m4 0h2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    handover: '<path d="M8 5h12l-3-3m3 3-3 3M16 19H4l3 3m-3-3 3-3M3 5h2m14 14h2M7 12h10"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    leaf: '<path d="M20 4C6 2 2 8 7 16s15-1 13-12ZM4 21 16 9"/>',
    external:
      '<path d="M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  };
  const icon = (name) =>
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (icons[name] || icons.sun) +
    '</svg>';
  const esc = (value) =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  const dayKey = (date) => new Date(date).toISOString().slice(0, 10);
  const addDays = (date, amount) => dayKey(Date.parse(date + 'T12:00:00Z') + amount * 86400000);
  const weekday = (date) => new Date(date + 'T12:00:00Z').getUTCDay();
  const monday = (date) => addDays(date, -((weekday(date) + 6) % 7));
  const fmt = (date, options) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(
      new Date(date + 'T12:00:00Z'),
    );
  const shortDate = (date) => fmt(date, { day: 'numeric', month: 'short' });
  const dateRange = (a) =>
    shortDate(a.start_date) +
    (a.start_date === a.end_date ? '' : ' – ' + shortDate(a.end_date)) +
    (a.start_date.slice(0, 4) !== state.data.today.slice(0, 4) ||
    a.end_date.slice(0, 4) !== a.start_date.slice(0, 4)
      ? ', ' +
        a.start_date.slice(0, 4) +
        (a.end_date.slice(0, 4) !== a.start_date.slice(0, 4) ? '–' + a.end_date.slice(0, 4) : '')
      : '');
  const workdays = (start, end) => {
    let n = 0;
    if (!start || !end || end < start) return 0;
    for (let d = start, i = 0; d <= end && i < 100; d = addDays(d, 1), i++)
      if (![0, 6].includes(weekday(d))) n++;
    return n;
  };
  const typeClass = (type) =>
    type === 'Vacation' ? 'vacation' : type === 'Personal day' ? 'personal' : 'sick';
  let selectedPerson = 'alex';
  // Preserve the selected fictional profile for visitors of the earlier Away branding.
  try {
    selectedPerson =
      localStorage.getItem('oooh-person') || localStorage.getItem('away-person') || 'alex';
  } catch {}
  const state = {
    data: null,
    view: 'overview',
    person: selectedPerson,
    week: null,
    team: '',
    search: '',
    handoverFilter: 'all',
    modal: null,
    error: null,
  };
  const person = (id) => state.data.team.find((p) => p.id === id);
  const initials = (name) =>
    name
      .split(' ')
      .map((x) => x[0])
      .slice(0, 2)
      .join('');
  const avatar = (id, small = false) => {
    const p = person(id);
    return p
      ? '<span class="avatar ' +
          p.color +
          (small ? ' small' : '') +
          '" aria-hidden="true">' +
          esc(initials(p.name)) +
          '</span>'
      : '';
  };
  const awayOn = (id, date) =>
    state.data.absences.find(
      (a) =>
        a.person_id === id &&
        a.start_date <= date &&
        a.end_date >= date &&
        ![0, 6].includes(weekday(date)),
    );
  const upcoming = () =>
    state.data.absences
      .filter((a) => a.start_date > state.data.today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  function toast(message, error = false) {
    const el = $('#toast');
    el.textContent = message;
    el.className = 'toast visible' + (error ? ' toast-error' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (el.className = ''), 5000);
  }
  async function api(path, method = 'GET', body) {
    const response = await fetch('/api/' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }
  async function load(quiet = false) {
    try {
      const data = await api('state');
      const changed = JSON.stringify(data) !== JSON.stringify(state.data);
      state.data = data;
      state.error = null;
      if (!person(state.person)) state.person = 'alex';
      if (!state.week) state.week = monday(data.today);
      if (changed || !quiet) render();
      return true;
    } catch (e) {
      if (!state.data) {
        state.error = e.message;
        render();
      } else if (!quiet) toast(e.message, true);
      return false;
    }
  }
  const actionButton = (action, label, className = 'button', extra = '') =>
    '<button class="' +
    className +
    '" data-action="' +
    action +
    '" ' +
    extra +
    '>' +
    label +
    '</button>';
  const empty = (title, text, button = '') =>
    '<div class="empty-state">' +
    icon('sun') +
    '<h3>' +
    title +
    '</h3><p>' +
    text +
    '</p>' +
    button +
    '</div>';
  function render() {
    if (!state.data) {
      app.innerHTML =
        '<div class="initial-loading"><span class="brand-mark" aria-hidden="true">O</span><h2>' +
        (state.error ? 'A little connection hiccup.' : 'Making room for time away…') +
        '</h2>' +
        (state.error
          ? '<p>' + esc(state.error) + '</p>' + actionButton('retry', 'Try again', 'button primary')
          : '') +
        '</div>';
      return;
    }
    const focused = document.activeElement?.id;
    const caret = focused === 'team-search' ? document.activeElement.selectionStart : null;
    const active = (view, symbol, label, count = null) =>
      '<button data-action="view" data-view="' +
      view +
      '" class="nav-item ' +
      (state.view === view ? 'active' : '') +
      '"' +
      (state.view === view ? ' aria-current="page"' : '') +
      '>' +
      icon(symbol) +
      '<span>' +
      label +
      '</span>' +
      (count > 0 ? '<span class="nav-count">' + count + '</span>' : '') +
      '</button>';
    app.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a><aside class="sidebar"><a href="/" class="brand"><span class="brand-mark" aria-hidden="true">O<span></span></span><span>OOOh!<span class="brand-caption">OUT OF OFFICE. IN GOOD HANDS.</span></span></a><div class="workspace"><span class="workspace-logo">n.</span><span><strong>Northstar</strong><small>Our team workspace</small></span><span class="workspace-dots">···</span></div><div class="nav-label">WORKSPACE</div><nav aria-label="Main navigation">' +
      active('overview', 'grid', 'Overview') +
      active('planner', 'calendar', 'Team planner') +
      active('mine', 'sun', 'My time off') +
      active(
        'handovers',
        'handover',
        'Handovers',
        state.data.absences.filter(
          (a) => a.end_date >= state.data.today && !a.ready && (a.title || a.notes),
        ).length,
      ) +
      '</nav><div class="sidebar-story"><span class="story-symbol">' +
      icon('spark') +
      '</span><h3>A team tool.<br>Built by the team.</h3><p>Not another big system.<br>Just what we needed.</p>' +
      actionButton('story', 'Meet Applet ' + icon('arrow'), 'text-button') +
      '</div><div class="sidebar-footer"><span class="live-dot"></span> Shared demo workspace<span class="made-with">Made with <a href="https://applet.one" target="_blank" rel="noopener noreferrer">applet ↗</a></span></div></aside><div class="workspace-main"><div class="demo-strip"><span><span class="demo-tag">DEMO</span> Fictional people. Real functionality.</span>' +
      actionButton('demo', 'About this workspace ' + icon('external'), 'text-button') +
      '</div><header class="topbar"><div class="breadcrumb">Northstar <span>/</span> Team workspace</div><label class="profile-switch"><span>Viewing as</span><span class="profile-avatar">' +
      avatar(state.person, true) +
      '</span><select id="profile" aria-label="View as a fictional teammate">' +
      state.data.team
        .map(
          (p) =>
            '<option value="' +
            p.id +
            '" ' +
            (p.id === state.person ? 'selected' : '') +
            '>' +
            esc(p.name) +
            '</option>',
        )
        .join('') +
      '</select></label></header><main id="main" tabindex="-1"><div class="page-heading"><div><div class="eyebrow">THE NORTHSTAR TEAM</div><h1>' +
      {
        overview: 'Team overview',
        planner: 'Team planner',
        mine: 'My time off',
        handovers: 'Good hands. Clear handovers.',
      }[state.view] +
      '</h1><p>' +
      {
        overview: 'A little visibility goes a long way.',
        planner: 'See who’s around. Plan ahead, together.',
        mine: 'Your next adventure starts with a little planning.',
        handovers: 'Keep things moving while someone takes a breather.',
      }[state.view] +
      '</p></div>' +
      actionButton('new', icon('plus') + ' Plan time off', 'button primary') +
      '</div>' +
      { overview: overview, planner: plannerView, mine: mineView, handovers: handoversView }[
        state.view
      ]() +
      '<footer class="page-footer"><span>A little less admin. A little more life.</span><span>Built with Applet · All dates use UTC</span></footer></main></div>';
    if (focused && document.getElementById(focused)) {
      document.getElementById(focused).focus();
      if (caret !== null) document.getElementById(focused).setSelectionRange(caret, caret);
    }
  }
  function landscape() {
    return '<svg class="landscape" viewBox="0 0 380 240" fill="none" aria-hidden="true"><circle cx="234" cy="89" r="52" fill="#ed683e"/><path d="M234 21v-9m48 33 8-7m-104 7-8-7m114 51h12m-141 0h-12" stroke="#dc633f" stroke-width="2"/><path d="M11 178c56-47 91-61 143-37 51 23 89-10 131-33 37-20 66 7 91 29v95H11Z" fill="#b5bfa1"/><path d="M3 215c62-45 109-40 166-14 43 21 83-47 135-39 36 6 49 31 76 35v43H3Z" fill="#6c8068"/><path d="M221 144c-44 9-54 23-38 35 21 16 42 20 17 34-8 5-22 13-31 27" stroke="#f5ecda" stroke-width="19"/><path d="m91 136 7-22 8 22m-8-16v33m213-1 9-30 11 30m-11-18v40" stroke="#4e6553" stroke-width="3" stroke-linecap="round"/><path d="M79 52c9-7 16-7 24 0m9 8c7-6 13-6 19 0" stroke="#665e50" stroke-width="2" stroke-linecap="round"/><circle cx="180" cy="177" r="5" fill="#2d3530"/><path d="m180 183-3 12m3-8 8 4m-10 2-6 8m6-8 5 9" stroke="#2d3530" stroke-width="3" stroke-linecap="round"/><path d="M173 185h8v9h-8z" fill="#ef683e"/><path d="m46 208 2-6m2 8 3-5m290 13 3-7m2 9 4-4" stroke="#ccd3ba" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function overview() {
    const today = state.data.today;
    const away = state.data.team.filter((p) => awayOn(p.id, today));
    const around = state.data.team.filter((p) => !awayOn(p.id, today));
    const soon = upcoming().filter((a) => a.start_date <= addDays(today, 14));
    return (
      '<section class="hero"><div class="hero-copy"><span class="eyebrow">LESS ADMIN. MORE LIVING.</span><h2>Good work needs<br><span>room to recharge.</span></h2><p>Plan your time away. Leave things in good hands.<br>We’ll hold the fort while you’re out.</p><div class="hero-note">' +
      icon('check') +
      ' No approvals. Just a heads-up.</div></div><div class="hero-art">' +
      landscape() +
      '<span class="art-caption">GO AHEAD. TAKE THE SCENIC ROUTE.</span></div></section><section class="stats" aria-label="Team availability"><div class="stat-card"><div class="stat-top"><span>Around today</span>' +
      icon('sun') +
      '</div><div class="stat-value">' +
      around.length +
      '<span>/ ' +
      state.data.team.length +
      ' teammates</span></div><div class="stat-bottom"><div class="avatar-stack">' +
      around
        .slice(0, 4)
        .map((p) => avatar(p.id, true))
        .join('') +
      '</div><span>' +
      ([0, 6].includes(weekday(today)) ? 'It’s the weekend — enjoy it' : 'Keeping things moving') +
      '</span></div></div><div class="stat-card"><div class="stat-top"><span>Out of office</span>' +
      icon('leaf') +
      '</div><div class="stat-value">' +
      away.length +
      '<span>taking a breather</span></div><div class="stat-bottom"><span class="status-dot orange-dot"></span><span>' +
      (away.length
        ? esc(away.map((p) => p.name.split(' ')[0]).join(' & ')) +
          (away.length === 1 ? ' is' : ' are') +
          ' away today'
        : 'Nobody away today') +
      '</span></div></div><div class="stat-card"><div class="stat-top"><span>On the horizon</span>' +
      icon('calendar') +
      '</div><div class="stat-value">' +
      soon.length +
      '<span>upcoming absences</span></div><div class="stat-bottom"><span class="status-dot purple-dot"></span><span>In the next two weeks</span></div></div></section>' +
      planner(false) +
      '<div class="bottom-grid"><section class="panel coming-up"><div class="section-header"><h2>Next up, time away <span class="mini-label">' +
      upcoming().length +
      '</span></h2>' +
      actionButton('view', 'See planner ' + icon('arrow'), 'text-button', 'data-view="planner"') +
      '</div>' +
      (upcoming().length
        ? upcoming()
            .slice(0, 3)
            .map((a) => upcomingRow(a))
            .join('')
        : empty('Nothing on the horizon.', 'A good time to plan your next breather.')) +
      '</section><section class="panel handover-summary"><div class="section-header"><h2>In good hands</h2><span class="soft-icon">' +
      icon('handover') +
      '</span></div><p class="section-description">A little context makes a big difference.</p>' +
      state.data.absences
        .filter((a) => a.end_date >= today && (a.title || a.notes))
        .slice(0, 2)
        .map(
          (a) =>
            '<button class="handover-mini" data-action="details" data-id="' +
            a.id +
            '"><span class="handover-state ' +
            (a.ready ? 'is-ready' : 'needs-cover') +
            '">' +
            icon(a.ready ? 'check' : 'clock') +
            '</span><span><strong>' +
            esc(a.title || 'Handover notes') +
            '</strong><small>' +
            esc(person(a.person_id).name.split(' ')[0]) +
            ' → ' +
            (a.cover_id ? esc(person(a.cover_id).name.split(' ')[0]) : 'Cover needed') +
            '</small></span><span class="mini-status">' +
            (a.ready ? 'Ready' : 'To do') +
            '</span></button>',
        )
        .join('') +
      actionButton(
        'view',
        'All handovers ' + icon('arrow'),
        'text-button handover-link',
        'data-view="handovers"',
      ) +
      '</section></div><section class="applet-banner"><span class="banner-icon">' +
      icon('spark') +
      '</span><div><h3>Your team. Your way.</h3><p>This started with “we could use a better way to plan time off.” What would you build?</p></div>' +
      actionButton('story', 'Small idea. Real app. ' + icon('arrow'), 'button') +
      '</section>'
    );
  }
  function upcomingRow(a) {
    const p = person(a.person_id);
    return (
      '<button class="upcoming-row" data-action="details" data-id="' +
      a.id +
      '">' +
      avatar(p.id) +
      '<span class="upcoming-person"><strong>' +
      esc(p.name) +
      '</strong><small>' +
      esc(p.role) +
      '</small></span><span class="upcoming-dates"><strong>' +
      dateRange(a) +
      '</strong><small>' +
      workdays(a.start_date, a.end_date) +
      ' working day' +
      (workdays(a.start_date, a.end_date) === 1 ? '' : 's') +
      '</small></span><span class="type-badge ' +
      typeClass(a.type) +
      '">' +
      esc(a.type) +
      '</span>' +
      icon('chevron') +
      '</button>'
    );
  }
  function plannerView() {
    return (
      planner(true) +
      '<div class="planner-tip">' +
      icon('spark') +
      '<span><strong>Plan a break, not a bottleneck.</strong> Click an absence to see the details and who’s holding the fort.</span></div>'
    );
  }
  function planner(full) {
    const departments = [...new Set(state.data.team.map((p) => p.team))];
    return (
      '<section class="panel planner-panel"><div class="section-header planner-heading"><div><h2>Who’s around?</h2><p class="section-description">A shared view of the days ahead.</p></div><div class="planner-tools"><label class="team-filter"><span class="sr-only">Filter by team</span><select id="team-filter"><option value="">All teams</option>' +
      departments
        .map((t) => '<option ' + (state.team === t ? 'selected' : '') + '>' + esc(t) + '</option>')
        .join('') +
      '</select></label>' +
      (full
        ? '<label class="search-field">' +
          icon('search') +
          '<input type="search" id="team-search" placeholder="Find a teammate…" aria-label="Find a teammate" value="' +
          esc(state.search) +
          '"></label>'
        : '') +
      '</div></div><div class="planner-period"><div class="range-controls">' +
      actionButton(
        'prev-week',
        icon('chevron'),
        'icon-button previous',
        'aria-label="Previous week"',
      ) +
      '<strong>' +
      shortDate(state.week) +
      ' – ' +
      shortDate(addDays(state.week, 11)) +
      ', ' +
      state.week.slice(0, 4) +
      '</strong>' +
      actionButton('next-week', icon('chevron'), 'icon-button', 'aria-label="Next week"') +
      actionButton('today', 'Today', 'button small-button') +
      '</div><div class="legend"><span><i class="vacation"></i>Vacation</span><span><i class="personal"></i>Personal</span><span><i class="sick"></i>Sick leave</span></div></div><div class="timeline-scroll" tabindex="0" aria-label="Team availability calendar; scroll horizontally on smaller screens"><div class="timeline">' +
      timeline() +
      '</div></div><div class="planner-bottom"><span><span class="live-dot"></span> Shared with the team</span><span>Weekends off the grid. Just like you.</span></div></section>'
    );
  }
  function timeline() {
    const days = Array.from({ length: 14 }, (_, i) => addDays(state.week, i)).filter(
      (d) => ![0, 6].includes(weekday(d)),
    );
    const people = state.data.team.filter(
      (p) =>
        (!state.team || p.team === state.team) &&
        (!state.search ||
          (p.name + ' ' + p.role).toLowerCase().includes(state.search.toLowerCase())),
    );
    let html =
      '<div class="timeline-header"><span class="team-column">TEAMMATE <span>' +
      people.length +
      '</span></span><div class="day-heads">' +
      days
        .map(
          (d, i) =>
            '<div class="day-head ' +
            (d === state.data.today ? 'is-today' : '') +
            (i === 5 ? ' week-divider' : '') +
            '"><span>' +
            fmt(d, { weekday: 'short' }) +
            '</span><strong>' +
            fmt(d, { day: 'numeric' }) +
            '</strong></div>',
        )
        .join('') +
      '</div></div>';
    if (!people.length)
      return html + empty('No teammates found.', 'Try another name or choose a different team.');
    html += people
      .map((p) => {
        const absences = state.data.absences.filter(
          (a) => a.person_id === p.id && a.start_date <= days[9] && a.end_date >= days[0],
        );
        const bars = absences
          .map((a) => {
            const covered = days
              .map((d, i) => (d >= a.start_date && d <= a.end_date ? i : -1))
              .filter((i) => i !== -1);
            if (!covered.length) return '';
            const first = covered[0],
              span = covered.length;
            return (
              '<button class="absence-bar ' +
              typeClass(a.type) +
              (span === 1 ? ' one-day' : '') +
              '" style="grid-column:' +
              (first + 1) +
              ' / span ' +
              span +
              '" data-action="details" data-id="' +
              a.id +
              '" title="' +
              esc(p.name + ': ' + a.type + ', ' + dateRange(a)) +
              '" aria-label="' +
              esc(p.name + ': ' + a.type + ', ' + dateRange(a)) +
              '"><span>' +
              (a.type === 'Vacation'
                ? icon('sun')
                : a.type === 'Personal day'
                  ? icon('leaf')
                  : icon('plus')) +
              '</span><span class="bar-label">' +
              (a.type === 'Personal day' ? 'Personal' : esc(a.type)) +
              '</span>' +
              (a.ready && span > 2 ? '<span class="bar-check">' + icon('check') + '</span>' : '') +
              '</button>'
            );
          })
          .join('');
        return (
          '<div class="timeline-row"><div class="teammate">' +
          avatar(p.id) +
          '<span><strong>' +
          esc(p.name) +
          (p.id === state.person ? '<em>you</em>' : '') +
          '</strong><small>' +
          esc(p.role) +
          '</small></span></div><div class="track">' +
          days
            .map(
              (d, i) =>
                '<span class="grid-day ' +
                (d === state.data.today ? 'today-column' : '') +
                (i === 5 ? ' week-divider' : '') +
                '" style="grid-column:' +
                (i + 1) +
                '"></span>',
            )
            .join('') +
          bars +
          '</div></div>'
        );
      })
      .join('');
    return html;
  }
  function mineView() {
    const mine = state.data.absences.filter((a) => a.person_id === state.person);
    const planned = mine.filter((a) => a.end_date >= state.data.today);
    const past = mine.filter((a) => a.end_date < state.data.today).reverse();
    return (
      '<section class="my-intro">' +
      avatar(state.person) +
      '<div><strong>' +
      esc(person(state.person).name) +
      '</strong><p>' +
      (planned.length
        ? planned.length +
          ' planned absence' +
          (planned.length === 1 ? '' : 's') +
          '. Something to look forward to.'
        : 'Nothing planned yet. A little break can go a long way.') +
      '</p></div><span class="no-approval">' +
      icon('check') +
      ' No approval needed</span></section><section class="panel list-panel"><div class="section-header"><h2>Planned time away <span class="mini-label">' +
      planned.length +
      '</span></h2></div>' +
      (planned.length
        ? planned.map(absenceCard).join('')
        : empty(
            'Your next breather is yours to plan.',
            'Pick your dates, add a handover if needed, and you’re set.',
            actionButton('new', 'Plan time off', 'button primary'),
          )) +
      '</section>' +
      (past.length
        ? '<section class="panel list-panel past-panel"><div class="section-header"><h2>Past absences</h2></div>' +
          past.map(absenceCard).join('') +
          '</section>'
        : '')
    );
  }
  function absenceCard(a) {
    return (
      '<button class="absence-card" data-action="details" data-id="' +
      a.id +
      '"><span class="absence-card-icon ' +
      typeClass(a.type) +
      '">' +
      icon(a.type === 'Vacation' ? 'sun' : 'leaf') +
      '</span><div class="absence-card-main"><h3>' +
      esc(a.type) +
      '</h3><p>' +
      dateRange(a) +
      ' <span>·</span> ' +
      workdays(a.start_date, a.end_date) +
      ' working day' +
      (workdays(a.start_date, a.end_date) === 1 ? '' : 's') +
      '</p></div><span class="coverage-badge ' +
      (a.ready ? 'covered' : '') +
      '">' +
      icon(a.ready ? 'check' : 'handover') +
      ' ' +
      (a.ready ? 'Handover ready' : a.cover_id ? 'Handover in progress' : 'No handover assigned') +
      '</span>' +
      icon('chevron') +
      '</button>'
    );
  }
  function handoversView() {
    const all = state.data.absences.filter(
      (a) => a.end_date >= state.data.today && (a.title || a.notes || a.cover_id),
    );
    const filtered = all.filter(
      (a) =>
        state.handoverFilter === 'all' ||
        (state.handoverFilter === 'me' ? a.cover_id === state.person : !a.ready),
    );
    return (
      '<div class="handover-toolbar"><div class="segmented" role="group" aria-label="Filter handovers">' +
      [
        ['all', 'All handovers'],
        ['me', 'Covering for others'],
        ['todo', 'Needs attention'],
      ]
        .map(([value, label]) =>
          actionButton(
            'handover-filter',
            label,
            'segment ' + (state.handoverFilter === value ? 'selected' : ''),
            'data-value="' + value + '" aria-pressed="' + (state.handoverFilter === value) + '"',
          ),
        )
        .join('') +
      '</div><span class="muted">' +
      all.filter((a) => a.ready).length +
      ' of ' +
      all.length +
      ' ready</span></div><div class="handover-cards">' +
      (filtered.length
        ? filtered
            .map(
              (a) =>
                '<article class="panel handover-card"><div class="handover-card-top"><span class="coverage-badge ' +
                (a.ready ? 'covered' : '') +
                '">' +
                icon(a.ready ? 'check' : 'clock') +
                ' ' +
                (a.ready ? 'Ready to go' : 'Needs attention') +
                '</span><span class="muted">' +
                dateRange(a) +
                '</span></div><h2>' +
                esc(a.title || 'Handover notes') +
                '</h2><p class="handover-notes">' +
                esc(a.notes || 'No notes added yet.') +
                '</p><div class="handover-people"><div>' +
                avatar(a.person_id, true) +
                '<span><small>Taking time away</small><strong>' +
                esc(person(a.person_id).name) +
                '</strong></span></div>' +
                icon('arrow') +
                '<div>' +
                (a.cover_id
                  ? avatar(a.cover_id, true)
                  : '<span class="avatar small unassigned">?</span>') +
                '<span><small>Holding the fort</small><strong>' +
                (a.cover_id ? esc(person(a.cover_id).name) : 'Not assigned yet') +
                '</strong></span></div></div><div class="handover-card-footer">' +
                actionButton(
                  'details',
                  'View handover ' + icon('arrow'),
                  'text-button',
                  'data-id="' + a.id + '"',
                ) +
                '</div></article>',
            )
            .join('')
        : '<section class="panel">' +
          empty(
            'All clear here.',
            state.handoverFilter === 'me'
              ? 'No one has asked you to cover an upcoming absence.'
              : 'No handovers need attention in this view.',
          ) +
          '</section>') +
      '</div>'
    );
  }
  function closeModal() {
    const dialog = $('#dialog');
    if (dialog) dialog.close();
    $('#modal-root').innerHTML = '';
    state.modal = null;
  }
  function openModal(content, kind, id) {
    const old = $('#dialog');
    if (old) old.close();
    state.modal = { kind, id };
    $('#modal-root').innerHTML =
      '<dialog id="dialog" class="modal ' +
      (kind === 'story' || kind === 'demo' ? 'story-modal' : '') +
      '" aria-labelledby="dialog-title">' +
      actionButton('close', icon('close'), 'icon-button modal-close', 'aria-label="Close dialog"') +
      content +
      '</dialog>';
    const dialog = $('#dialog');
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeModal();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          closeModal();
      }
    });
    dialog.showModal();
  }
  function showForm(id) {
    const a = id ? state.data.absences.find((a) => a.id === id) : null;
    if (id && !a) return toast('This absence no longer exists. Refresh and try again.', true);
    const owner = a ? a.person_id : state.person;
    let start = a ? a.start_date : state.data.today;
    while (!a && [0, 6].includes(weekday(start))) start = addDays(start, 1);
    const end = a ? a.end_date : start;
    openModal(
      '<div class="dialog-eyebrow">' +
        icon('sun') +
        ' A LITTLE TIME FOR YOU</div><h2 id="dialog-title">' +
        (a ? 'Update your time away.' : 'Make room for a breather.') +
        '</h2><p class="dialog-description">No approvals. Just keep your team in the loop.</p><div class="form-person">' +
        avatar(owner, true) +
        '<span>Planning for <strong>' +
        esc(person(owner).name) +
        '</strong></span></div><form id="absence-form" data-person="' +
        owner +
        '" data-id="' +
        (id || '') +
        '" data-version="' +
        (a ? a.version : '') +
        '"><label>Type of absence<select name="type">' +
        ['Vacation', 'Personal day', 'Sick leave']
          .map((t) => '<option ' + (a?.type === t ? 'selected' : '') + '>' + t + '</option>')
          .join('') +
        '</select></label><div class="form-row"><label>First day away<input type="date" name="start_date" required value="' +
        start +
        '" min="' +
        addDays(state.data.today, -366) +
        '" max="' +
        addDays(state.data.today, 730) +
        '"></label><label>Last day away<input type="date" name="end_date" required value="' +
        end +
        '" min="' +
        start +
        '" max="' +
        addDays(state.data.today, 730) +
        '"></label></div><div id="day-estimate" class="day-estimate">' +
        workdays(start, end) +
        ' working day' +
        (workdays(start, end) === 1 ? '' : 's') +
        ' · Weekends don’t count</div><div class="form-section-title"><span>' +
        icon('handover') +
        ' Leave it in good hands</span><small>Optional</small></div><label>Who’s covering?<select name="cover_id"><option value="">No cover needed / decide later</option>' +
        state.data.team
          .filter((p) => p.id !== owner)
          .map(
            (p) =>
              '<option value="' +
              p.id +
              '" ' +
              (a?.cover_id === p.id ? 'selected' : '') +
              '>' +
              esc(p.name) +
              '</option>',
          )
          .join('') +
        '</select></label><label>What needs a handover?<input name="title" maxlength="80" placeholder="e.g. Weekly project check-in" value="' +
        esc(a?.title || '') +
        '"></label><label>A little context<textarea name="notes" rows="3" maxlength="1000" placeholder="What should your teammate know while you’re away?">' +
        esc(a?.notes || '') +
        '</textarea></label><label class="checkbox-label"><input type="checkbox" name="ready" ' +
        (a?.ready ? 'checked' : '') +
        '><span>Handover is ready<small>Add a cover teammate and notes to mark it ready.</small></span></label><div class="form-error" id="form-error" role="alert"></div><div class="dialog-footer">' +
        actionButton('close', 'Cancel', 'button') +
        '<button type="submit" class="button primary">' +
        icon('check') +
        (a ? ' Save changes' : ' Publish time off') +
        '</button></div><p class="form-disclaimer">Shared fictional demo. Please don’t enter personal or company information.</p></form>',
      'form',
      id,
    );
    $('#absence-form').addEventListener('submit', saveForm);
    $('#absence-form').addEventListener('input', (event) => {
      const form = event.currentTarget;
      if (event.target.name === 'start_date') {
        if (form.end_date.value < form.start_date.value)
          form.end_date.value = form.start_date.value;
        form.end_date.min = form.start_date.value;
      }
      if (event.target.name === 'start_date' || event.target.name === 'end_date') {
        const n = workdays(form.start_date.value, form.end_date.value);
        $('#day-estimate').textContent =
          n + ' working day' + (n === 1 ? '' : 's') + ' · Weekends don’t count';
      }
    });
  }
  async function saveForm(event) {
    event.preventDefault();
    const form = event.currentTarget,
      submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    data.person_id = form.dataset.person;
    data.ready = form.ready.checked;
    if (form.dataset.id) data.version = Number(form.dataset.version);
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = 'Saving…';
    $('#form-error').textContent = '';
    try {
      await api(
        'absences' + (form.dataset.id ? '/' + form.dataset.id : ''),
        form.dataset.id ? 'PUT' : 'POST',
        data,
      );
      closeModal();
      await load();
      toast(
        form.dataset.id
          ? 'Time away updated. Your team is in the loop.'
          : 'Time off published. Here’s to a good break.',
      );
    } catch (e) {
      if ($('#form-error')) $('#form-error').textContent = e.message;
      submit.disabled = false;
      submit.innerHTML = original;
    }
  }
  function showDetails(id) {
    const a = state.data.absences.find((a) => a.id === id);
    if (!a) return toast('This absence no longer exists.', true);
    const p = person(a.person_id);
    openModal(
      '<div class="detail-person">' +
        avatar(p.id) +
        '<div><span class="eyebrow">TIME AWAY</span><h2 id="dialog-title">' +
        esc(p.name) +
        '</h2><p>' +
        esc(p.role) +
        '</p></div></div><div class="detail-absence"><span class="type-badge ' +
        typeClass(a.type) +
        '">' +
        esc(a.type) +
        '</span><h3>' +
        dateRange(a) +
        '</h3><p>' +
        workdays(a.start_date, a.end_date) +
        ' working day' +
        (workdays(a.start_date, a.end_date) === 1 ? '' : 's') +
        ' · No approval needed</p></div><div class="detail-handover"><div class="section-header"><h3>' +
        icon('handover') +
        ' In good hands</h3><span class="coverage-badge ' +
        (a.ready ? 'covered' : '') +
        '">' +
        (a.ready ? 'Ready' : 'Not marked ready') +
        '</span></div><h4>' +
        esc(a.title || 'Handover notes') +
        '</h4><p class="detail-notes">' +
        esc(a.notes || 'No handover notes yet. Sometimes a simple heads-up is enough.') +
        '</p><div class="detail-cover">' +
        (a.cover_id
          ? avatar(a.cover_id, true) +
            '<span><small>Holding the fort</small><strong>' +
            esc(person(a.cover_id).name) +
            '</strong></span>'
          : '<span class="muted">No cover teammate assigned.</span>') +
        '</div></div><div class="dialog-footer"><button class="text-button danger" data-action="confirm-delete" data-id="' +
        id +
        '">Remove absence</button>' +
        actionButton('edit', 'Edit details', 'button primary', 'data-id="' + id + '"') +
        '</div>',
      'details',
      id,
    );
  }
  function confirmDelete(id) {
    const a = state.data.absences.find((a) => a.id === id);
    if (!a) return;
    openModal(
      '<div class="dialog-eyebrow">CHANGE OF PLANS?</div><h2 id="dialog-title">Remove this absence?</h2><p class="dialog-description">' +
        esc(person(a.person_id).name) +
        ' · ' +
        dateRange(a) +
        '. This removes the absence and its handover notes from the shared demo.</p><div id="form-error" class="form-error" role="alert"></div><div class="dialog-footer">' +
        actionButton('details', 'Keep it', 'button', 'data-id="' + id + '"') +
        actionButton(
          'delete',
          'Yes, remove it',
          'button danger-button',
          'data-id="' + id + '" data-version="' + a.version + '"',
        ) +
        '</div>',
      'delete',
      id,
    );
  }
  function showStory() {
    openModal(
      '<div class="dialog-eyebrow">' +
        icon('spark') +
        ' A SMALL IDEA. A REAL APP.</div><h2 id="dialog-title">“We could use a better<br>way to plan time off.”</h2><p class="story-lead">That’s how a useful team tool starts. Not with a procurement process. With someone who knows what their team needs.</p><div class="story-steps"><div><span>01</span><h3>Spot the everyday friction.</h3><p>Absences in a spreadsheet. Handovers buried in chat. Sound familiar?</p></div><div><span>02</span><h3>Make something that fits.</h3><p>Vibe-code a focused tool for your team’s way of working. Start small. Make it yours.</p></div><div><span>03</span><h3>Give the team a real app.</h3><p>Applet builds and hosts the app, with persistent shared state. A link to use, not a mockup to admire.</p></div></div><div class="integration-ideas"><span class="eyebrow">WHERE YOU COULD TAKE IT NEXT</span><div><span>' +
        icon('calendar') +
        ' Calendar sync</span><span>' +
        icon('grid') +
        ' HR systems</span><span>' +
        icon('handover') +
        ' Team chat</span></div><p>Ideas only. No external services are connected to this demo.</p></div><div class="dialog-footer"><span class="muted">A tool for your team. Built by your team.</span><a class="button primary" href="https://applet.one" target="_blank" rel="noopener noreferrer">Explore Applet ' +
        icon('external') +
        '</a></div>',
      'story',
    );
  }
  function showDemo() {
    openModal(
      '<div class="dialog-eyebrow">WELCOME TO THE DEMO</div><h2 id="dialog-title">Fictional team.<br>Real little tool.</h2><p class="story-lead">Meet Northstar: eight fictional teammates with somewhere to be, and a better way to keep each other in the loop.</p><ul class="demo-list"><li><strong>Try it for yourself.</strong> Publish time off, choose a cover teammate, and add a handover. There’s no approval queue.</li><li><strong>Switch perspectives.</strong> “Viewing as” lets you explore any fictional teammate. It is not a login or authentication.</li><li><strong>Changes really stick.</strong> Absences and notes live in Applet-hosted persistent storage and are shared with everyone visiting this public demo.</li><li><strong>Keep it fictional.</strong> Don’t enter real personal, health, or company information. This demo is not a production HR system.</li><li><strong>No integrations.</strong> Calendar, HR, and chat connections are future ideas only. Working days are Monday–Friday; public holidays are not calculated.</li></ul><div class="dialog-footer">' +
        actionButton('close', 'Got it. Let’s explore.', 'button primary') +
        '</div>',
      'demo',
    );
  }
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'view') {
      state.view = button.dataset.view;
      render();
    } else if (action === 'new') showForm();
    else if (action === 'details') showDetails(button.dataset.id);
    else if (action === 'edit') showForm(button.dataset.id);
    else if (action === 'close') closeModal();
    else if (action === 'story') showStory();
    else if (action === 'demo') showDemo();
    else if (action === 'retry') load();
    else if (action === 'prev-week' || action === 'next-week') {
      state.week = addDays(state.week, action === 'prev-week' ? -7 : 7);
      render();
    } else if (action === 'today') {
      state.week = monday(state.data.today);
      render();
    } else if (action === 'handover-filter') {
      state.handoverFilter = button.dataset.value;
      render();
    } else if (action === 'confirm-delete') confirmDelete(button.dataset.id);
    else if (action === 'delete') {
      button.disabled = true;
      button.textContent = 'Removing…';
      try {
        await api('absences/' + button.dataset.id + '?version=' + button.dataset.version, 'DELETE');
        closeModal();
        await load();
        toast('Absence removed. The team planner is up to date.');
      } catch (e) {
        $('#form-error').textContent = e.message;
        button.disabled = false;
        button.textContent = 'Yes, remove it';
      }
    }
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'profile') {
      state.person = event.target.value;
      try {
        localStorage.setItem('oooh-person', state.person);
        localStorage.removeItem('away-person');
      } catch {}
      render();
    }
    if (event.target.id === 'team-filter') {
      state.team = event.target.value;
      render();
    }
  });
  document.addEventListener('input', (event) => {
    if (event.target.id === 'team-search') {
      state.search = event.target.value;
      render();
    }
  });
  load();
  setInterval(() => {
    if (!state.modal && document.visibilityState === 'visible') load(true);
  }, 30000);
})();
`;
