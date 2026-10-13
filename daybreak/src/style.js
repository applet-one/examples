export const style = `
:root {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: #392d2a;
  background: #fff8ef;
  font-synthesis: none;
  --ink: #392d2a;
  --muted: #796861;
  --coral: #b9432c;
  --line: #eadacf;
  --paper: #fffdf9;
}
* { box-sizing: border-box; }
body { margin: 0; }
button, input { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .45; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, p { margin: 0; }
h1, h2, h3 { letter-spacing: -.04em; }
h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; }
button:focus-visible, a:focus-visible { outline: 3px solid #b9432c; outline-offset: 4px; }
#app { min-height: 100vh; }
.shell { min-height: 100vh; }
.sidebar {
  display: flex;
  align-items: center;
  gap: 36px;
  padding: 20px 4%;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 10px; font-size: 26px; font-weight: 800; letter-spacing: -.07em; white-space: nowrap; }
.brand-icon { width: 35px; height: 35px; display: grid; place-items: center; color: var(--coral); font: 36px Georgia, serif; letter-spacing: 0; }
.side-label { display: none; }
.nav { display: flex; gap: 4px; }
.nav button { display: flex; align-items: center; gap: 9px; padding: 12px 16px; border: 0; border-radius: 100px; background: none; color: var(--muted); font-size: 13px; font-weight: 700; white-space: nowrap; }
.nav button:hover { background: #fff0e2; color: var(--ink); }
.nav button.active { background: #392d2a; color: #fff8ef; }
.nav svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.nav .badge { border-radius: 100px; background: #f6ba63; color: #392d2a; padding: 2px 6px; font-size: 10px; }
.sidebar-bottom { margin-left: auto; display: flex; align-items: center; gap: 18px; }
.profile { display: flex; align-items: center; gap: 10px; }
.avatar { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 50%; background: #f9d9c2; color: #843f2f; font-weight: 800; font-size: 12px; text-transform: uppercase; }
.profile strong { display: block; font-size: 12px; }
.profile small { display: block; max-width: 145px; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: 10px; }
.logout { border: 0; background: none; color: var(--muted); font-size: 11px; padding: 8px 0; white-space: nowrap; }
.main { min-width: 0; }
.content { max-width: 1440px; margin: 0 auto; padding: 28px 5% 70px; }
.topline { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 28px; }
.crumb { font-size: 11px; color: var(--muted); }
.crumb span { color: var(--ink); font-weight: 700; }
.timezone { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--muted); }
.timezone i { width: 6px; height: 6px; border-radius: 50%; background: var(--coral); }
.hero { position: relative; isolation: isolate; display: flex; justify-content: space-between; align-items: center; gap: 30px; padding: 26px 0 42px; margin-bottom: 0; overflow: hidden; }
.hero::before { content: ''; position: absolute; z-index: -1; width: 210px; height: 210px; right: 90px; top: 0; border-radius: 50%; background: linear-gradient(180deg, #ffcf79, #ffe9c8 75%, #fff8ef); opacity: .75; }
.eyebrow, .mini-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .18em; color: var(--coral); }
.eyebrow { margin-bottom: 15px; }
.hero h1 { max-width: 680px; font-size: clamp(38px, 4.5vw, 64px); line-height: 1.04; }
.hero p { max-width: 590px; margin-top: 17px; color: var(--muted); font-size: 13px; line-height: 1.7; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 100px; padding: 14px 22px; font-size: 12px; font-weight: 800; white-space: nowrap; transition: transform .15s, background .15s; }
.btn:hover:not(:disabled) { transform: translateY(-2px); }
.primary { background: var(--coral); color: #fff; }
.primary:hover { background: #9f3421; }
.secondary { background: #ffe2cf; color: #923b29; }
.ghost { background: var(--paper); border: 1px solid var(--line); color: var(--ink); }
.danger { background: #ffe1dc; color: #a22e29; }
.small { padding: 9px 13px; font-size: 11px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 0; align-items: stretch; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--paper); }
.panel { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; }
.calendar { padding: 28px 32px 24px; border: 0; border-radius: 0; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
.panel-head h2 { font-size: 21px; }
.panel-head p { margin-top: 5px; font-size: 11px; color: var(--muted); }
.cal-actions { display: flex; align-items: center; gap: 9px; }
.cal-actions button { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 50%; background: transparent; color: var(--ink); font-size: 21px; line-height: 1; }
.cal-actions button:hover { background: #fff0e2; }
.month { min-width: 112px; font-size: 12px; font-weight: 800; text-align: center; }
.weekdays, .days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; }
.weekdays { padding-bottom: 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.days { border-top: 1px solid var(--line); }
.day { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-width: 0; height: 69px; padding: 8px 2px; border: 0; border-bottom: 1px solid #f1e7dd; border-radius: 0; background: transparent; color: var(--ink); }
.day:hover { background: #fff0e2; }
.day.muted { color: #9c8b80; }
.day.selected { background: #ffe4d1; box-shadow: inset 0 -3px var(--coral); color: #843321; }
.number { display: grid; place-items: center; width: 28px; height: 28px; font-size: 12px; font-weight: 700; }
.day.today .number { background: var(--coral); color: #fff; border-radius: 50%; }
.dots { display: flex; gap: 4px; min-height: 5px; }
.dot { width: 5px; height: 5px; border-radius: 50%; background: var(--coral); }
.dot.friend { background: #b57916; }
.dot.booked { background: #7463a5; }
.legend { display: flex; flex-wrap: wrap; gap: 20px; padding-top: 20px; color: var(--muted); font-size: 10px; }
.legend span { display: flex; align-items: center; gap: 7px; }
.agenda { padding: 30px 24px; background: #fbe9d9; border: 0; border-left: 1px solid var(--line); border-radius: 0; }
.agenda .mini-label { display: flex; align-items: center; gap: 8px; }
.agenda .mini-label::before { content: ''; width: 17px; height: 1px; background: var(--coral); }
.date-title { font-family: Georgia, serif; font-weight: 400; font-size: 31px; line-height: 1.15; margin: 17px 0 25px; }
.slot-list { display: flex; flex-direction: column; gap: 10px; }
.slot { display: flex; align-items: center; gap: 11px; padding: 15px 12px; background: #fff8f0; border: 1px solid #edd7c5; border-radius: 4px; }
.slot-mark { width: 3px; height: 33px; background: var(--coral); flex: none; }
.slot-mark.friend { background: #b57916; }
.slot-mark.booked { background: #7463a5; }
.slot-info { flex: 1; min-width: 0; }
.slot-info strong { display: block; font-size: 12px; }
.slot-info small { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; }
.iconbtn { border: 0; background: none; color: var(--muted); padding: 5px; font-size: 20px; }
.iconbtn:hover { color: var(--coral); }
.empty { padding: 22px 12px; border: 1px dashed #d6bdaa; border-radius: 4px; text-align: center; color: var(--muted); font-size: 12px; line-height: 1.8; }
.agenda .empty { text-align: left; padding: 22px 0; border: 0; border-top: 1px solid #e3cbb7; }
.social-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 36px; margin-top: 32px; }
.social-layout > .panel { padding: 0; border: 0; border-radius: 0; background: transparent; }
.social-layout > .panel + .panel { padding-left: 36px; border-left: 1px solid var(--line); }
.card-pad { padding: 26px; }
.split-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 17px; }
.split-header h2 { font-size: 18px; }
.textbtn { padding: 7px 0; border: 0; background: none; color: var(--coral); font-size: 11px; font-weight: 800; }
.friend-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.friend-row:last-child { border: 0; }
.friend-row .avatar { background: #f5d7a6; color: #78501b; }
.friend-row .info { flex: 1; min-width: 0; overflow: hidden; }
.friend-row strong { display: block; font-size: 13px; }
.friend-row small { display: block; margin-top: 3px; color: var(--muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.friend-row button { padding: 8px 12px; border: 1px solid #dec7b5; border-radius: 100px; color: #923b29; background: transparent; font-size: 10px; font-weight: 800; }
.friend-row.selected button { background: var(--coral); border-color: var(--coral); color: #fff; }
.below { margin-top: 24px; }
.meeting-row { display: flex; align-items: center; gap: 13px; border-top: 1px solid var(--line); padding: 16px 0; }
.meeting-row:first-of-type { border: 0; }
.meeting-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #ffe4ba; color: #965618; font-size: 23px; flex: none; }
.meeting-row .info { flex: 1; min-width: 0; }
.meeting-row strong { display: block; font-size: 13px; }
.meeting-row small { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
.pill { padding: 6px 9px; border-radius: 100px; color: #5f4a87; background: #ede6f6; font-size: 10px; font-weight: 800; white-space: nowrap; }
.pill.pending { background: #fff0cc; color: #815615; }
.request-card { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 16px; margin-top: 12px; border: 1px solid var(--line); border-radius: 4px; }
.request-card strong { display: block; font-size: 13px; }
.request-card small { display: block; margin-top: 5px; font-size: 11px; color: var(--muted); }
.request-card .actions { display: flex; gap: 7px; }
.request-card .actions button { padding: 9px 12px; }
.form-inline { display: flex; gap: 8px; margin: 18px 0 24px; }
.input { min-width: 0; padding: 13px 14px; background: var(--paper); color: var(--ink); border: 1px solid #d8c2b3; border-radius: 4px; outline: none; }
.input:focus { border-color: var(--coral); box-shadow: 0 0 0 3px #ffe0cc; }
.form-inline .input { flex: 1; }
.section-heading { font-size: 14px; margin: 24px 0 11px; }
.muted { color: var(--muted); font-size: 12px; line-height: 1.7; }
.fullpanel { padding: 28px; }
.fullpanel + .fullpanel { margin-top: 22px; }
.two-col { display: grid; grid-template-columns: 1.1fr 1fr; gap: 22px; }
.two-col > .fullpanel + .fullpanel { margin-top: 0; }
.modal-backdrop { position: fixed; inset: 0; background: #392d2a80; z-index: 10; display: grid; place-items: center; padding: 20px; overflow-y: auto; }
.modal { width: min(100%, 450px); background: var(--paper); border-top: 5px solid #ef9565; border-radius: 8px; padding: 30px; box-shadow: 0 24px 70px #392d2a33; }
.modal h2 { font-family: Georgia, serif; font-weight: 400; font-size: 32px; margin-bottom: 10px; }
.modal p { color: var(--muted); font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 17px; }
.field label { font-size: 11px; color: var(--ink); font-weight: 700; }
.field input { width: 100%; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.toast { position: fixed; right: 24px; bottom: 24px; background: var(--ink); color: #fff8ef; border-radius: 4px; padding: 15px 20px; box-shadow: 0 12px 30px #392d2a33; font-size: 13px; z-index: 20; max-width: min(350px, calc(100vw - 48px)); }
.toast.error { background: #a22e29; }
.auth-wrap { min-height: 100vh; display: grid; grid-template-columns: 1.15fr 1fr; }
.auth-art { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 9% 42px; background: #f7c69d; color: var(--ink); }
.auth-art .brand { position: relative; z-index: 1; }
.auth-art h1 { max-width: 540px; font-size: clamp(48px, 5.8vw, 84px); line-height: .99; }
.auth-art p { max-width: 340px; margin-top: 25px; font-size: 14px; color: #684b3e; line-height: 1.8; }
.auth-art .shape { position: absolute; z-index: -1; width: 540px; height: 540px; border-radius: 50%; right: -140px; top: 12%; background: linear-gradient(180deg, #ffe7a3, #ffc875 55%, #ef9060); box-shadow: 0 0 0 35px #ffd9aa80, 0 0 0 70px #ffd9aa40; }
.auth-art::after { content: ''; position: absolute; z-index: -1; height: 22%; inset: auto 0 0; background: #efaa80; border-top: 1px solid #d89166; }
.auth-foot { position: relative; font-size: 11px; color: #684b3e; }
.auth-side { display: grid; place-items: center; padding: 48px 36px; background: var(--paper); }
.auth-box { width: min(100%, 380px); }
.auth-box .eyebrow { margin-bottom: 18px; }
.auth-box h2 { font-family: Georgia, serif; font-weight: 400; font-size: 42px; line-height: 1.1; margin-bottom: 14px; }
.auth-box > p { color: var(--muted); font-size: 13px; line-height: 1.7; margin-bottom: 32px; }
.auth-box .field { margin-bottom: 20px; }
.auth-box .field input { padding: 15px; }
.auth-box .btn { width: 100%; padding: 16px; margin-top: 9px; }
.auth-switch { text-align: center; font-size: 12px; color: var(--muted); margin-top: 25px; }
.auth-switch button { border: 0; padding: 5px; background: none; color: var(--coral); font-weight: 800; }
.notice { color: #a22e29; font-size: 12px; margin: 12px 0; line-height: 1.6; }
.shared-window { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff4df; border: 1px solid #e6c69d; border-radius: 4px; padding: 12px; margin-top: 8px; }
.shared-window strong { font-size: 12px; }
.shared-window small { display: block; color: var(--muted); font-size: 10px; margin-top: 5px; }
@media (max-width: 1150px) {
  .sidebar { gap: 20px; padding: 18px 3%; }
  .nav button { padding: 11px 12px; }
  .profile small { display: none; }
  .sidebar-bottom { gap: 10px; }
  .profile strong { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .content { padding: 24px 3% 60px; }
  .layout { grid-template-columns: minmax(0, 1fr) 290px; }
  .calendar { padding: 25px 20px; }
  .hero h1 { font-size: 48px; max-width: 540px; }
}
@media (max-width: 850px) {
  .sidebar { flex-wrap: wrap; gap: 14px; }
  .nav { order: 3; width: 100%; }
  .nav button { flex: 1; justify-content: center; }
  .profile small { display: block; }
  .layout { grid-template-columns: minmax(0, 1fr) 260px; }
  .agenda { padding: 25px 18px; }
  .hero h1 { font-size: 43px; }
  .hero::before { right: 0; }
  .two-col { grid-template-columns: 1fr; }
  .auth-art { padding: 32px; }
}
@media (max-width: 620px) {
  .sidebar { padding: 17px 18px 12px; }
  .brand { font-size: 23px; }
  .brand-icon { width: 27px; font-size: 30px; }
  .profile > div { display: none; }
  .profile .avatar { width: 30px; height: 30px; font-size: 10px; }
  .logout { font-size: 10px; }
  .nav { gap: 2px; }
  .nav button { padding: 10px 5px; gap: 5px; font-size: 11px; }
  .nav svg { width: 14px; height: 14px; }
  .content { padding: 22px 18px 48px; }
  .topline { margin-bottom: 12px; }
  .crumb { font-size: 10px; }
  .timezone { font-size: 9px; }
  .hero { display: block; padding: 24px 0 28px; }
  .hero h1 { font-size: 44px; max-width: 360px; }
  .hero p { font-size: 12px; max-width: 320px; }
  .hero > .btn { margin-top: 22px; }
  .hero::before { width: 170px; height: 170px; right: -55px; top: 20px; opacity: .5; }
  .eyebrow { font-size: 9px; }
  .layout { grid-template-columns: 1fr; }
  .calendar { padding: 22px 14px; }
  .panel-head { flex-wrap: wrap; gap: 14px; margin-bottom: 23px; }
  .panel-head h2 { font-size: 18px; }
  .panel-head p { font-size: 10px; }
  .cal-actions { gap: 5px; }
  .cal-actions button { width: 25px; height: 25px; }
  .month { min-width: 98px; font-size: 11px; }
  .day { height: 57px; }
  .legend { gap: 13px; font-size: 9px; }
  .agenda { padding: 24px; border-left: 0; border-top: 1px solid var(--line); }
  .date-title { font-size: 29px; margin: 14px 0 20px; }
  .social-layout { grid-template-columns: minmax(0, 1fr); gap: 26px; margin-top: 28px; }
  .social-layout > .panel + .panel { border-left: 0; border-top: 1px solid var(--line); padding: 24px 0 0; }
  .fullpanel { padding: 22px 18px; }
  .form-inline { flex-wrap: wrap; }
  .form-inline .input { flex-basis: 100%; }
  .auth-wrap { grid-template-columns: 1fr; }
  .auth-art { min-height: 315px; padding: 25px; gap: 32px; }
  .auth-art h1 { font-size: 48px; max-width: 320px; }
  .auth-art p, .auth-foot { display: none; }
  .auth-art .shape { width: 300px; height: 300px; right: -80px; top: 55px; }
  .auth-side { padding: 36px 25px 48px; }
  .auth-box h2 { font-size: 36px; }
  .modal { padding: 25px 20px; }
}
@media (max-width: 380px) {
  .nav svg { display: none; }
  .nav button { padding: 10px 6px; }
}
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
  .btn:hover:not(:disabled) { transform: none; }
}
`;
