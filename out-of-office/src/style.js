export const style = String.raw`:root {
  --bg: #f6f5f1;
  --ink: #282b27;
  --muted: #7c7e75;
  --line: #e8e8e0;
  --orange: #dc5b37;
  --peach: #fbe6dc;
  --purple: #eee8f6;
  --green: #e5efdf;
  --sidebar: 224px;
  --radius: 13px;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Helvetica,
    Arial,
    sans-serif;
  color: var(--ink);
  background: var(--bg);
  font-synthesis: none;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button,
input,
select,
textarea {
  font: inherit;
}
button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: transparent;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: wait;
  opacity: 0.6;
}
button {
  color: inherit;
}
a {
  color: inherit;
}
button,
select,
input,
textarea {
  outline-offset: 4px;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--orange);
}
h1,
h2,
h3,
h4,
p {
  margin: 0;
}
button {
  border: 0;
}
svg {
  flex-shrink: 0;
}
.icon {
  width: 19px;
  height: 19px;
  vertical-align: middle;
  flex-shrink: 0;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.skip-link {
  position: fixed;
  left: 16px;
  top: -100px;
  z-index: 30;
  padding: 12px;
  background: var(--ink);
  color: white;
}
.skip-link:focus {
  top: 16px;
}
.muted {
  color: var(--muted);
  font-size: 12px;
}
.eyebrow {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1.65px;
  line-height: 1.5;
  color: var(--muted);
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #dedfd5;
  padding: 11px 17px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s,
    transform 0.15s;
}
.button:hover {
  background: #f4f4ee;
}
.button:active {
  transform: translateY(1px);
}
.button.primary {
  background: var(--orange);
  border-color: var(--orange);
  color: #fff;
  box-shadow: 0 2px 3px #b8442610;
}
.button.primary:hover {
  background: #c94e2d;
}
.button .icon {
  width: 17px;
  height: 17px;
}
.text-button {
  padding: 0;
  background: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.text-button:hover {
  color: var(--orange);
}
.text-button .icon {
  width: 15px;
  height: 15px;
}
.icon-button {
  background: none;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.icon-button:hover {
  background: #efefe8;
}
.icon-button .icon {
  width: 17px;
  height: 17px;
}
.icon-button.previous .icon {
  transform: rotate(180deg);
}
.small-button {
  padding: 5px 10px;
  font-size: 10px;
}
.initial-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
}
.initial-loading p {
  color: var(--muted);
  font-size: 14px;
}
.initial-loading h2 {
  font-size: 22px;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar);
  display: flex;
  flex-direction: column;
  padding: 32px 18px 18px;
  border-right: 1px solid var(--line);
  background: #fafaf6;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  padding: 0 8px;
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -1.2px;
}
.brand-mark {
  display: inline-flex;
  flex-shrink: 0;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 37px;
  height: 39px;
  background: var(--orange);
  border-radius: 11px;
  color: white;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -1px;
  line-height: 1;
}
.brand-mark span {
  position: absolute;
  width: 6px;
  height: 6px;
  right: 5px;
  top: 7px;
  border-radius: 50%;
  background: #fff;
}
.brand-caption {
  display: block;
  font-size: 6.5px;
  font-weight: 600;
  letter-spacing: 1.1px;
  margin-top: 2px;
  color: var(--muted);
}
.workspace {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  margin: 33px 1px 30px;
  padding: 12px 10px;
  background: #fff;
}
.workspace-logo {
  background: #edf0e9;
  color: #536449;
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  font-family: Georgia, serif;
  font-size: 23px;
  font-weight: bold;
  letter-spacing: -2px;
  border-radius: 7px;
  padding-right: 2px;
}
.workspace strong {
  display: block;
  font-size: 12px;
  font-weight: 650;
}
.workspace small {
  display: block;
  font-size: 9px;
  color: var(--muted);
  margin-top: 4px;
}
.workspace-dots {
  margin-left: auto;
  color: var(--muted);
  font-weight: bold;
  letter-spacing: 1px;
}
.nav-label {
  font-size: 8px;
  letter-spacing: 1.5px;
  font-weight: 600;
  color: #93958b;
  padding: 0 12px;
  margin-bottom: 11px;
}
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 12px;
  margin-bottom: 4px;
  background: none;
  font-size: 12px;
  text-align: left;
  border-radius: 7px;
  color: #77796f;
}
.nav-item .icon {
  width: 17px;
  height: 17px;
}
.nav-item:hover {
  background: #efefe8;
  color: var(--ink);
}
.nav-item.active {
  background: #f8e7df;
  color: #b84525;
  font-weight: 650;
}
.nav-count {
  margin-left: auto;
  background: #fff;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 9px;
  color: #848577;
}
.sidebar-story {
  margin-top: auto;
  padding: 23px 12px 24px;
}
.story-symbol {
  color: var(--orange);
  display: block;
  margin-bottom: 13px;
}
.story-symbol .icon {
  width: 23px;
  height: 23px;
}
.sidebar-story h3 {
  font-size: 17px;
  font-weight: 550;
  letter-spacing: -0.4px;
  line-height: 1.35;
}
.sidebar-story p {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 9px;
}
.sidebar-story .text-button {
  margin-top: 16px;
  font-size: 11px;
}
.sidebar-footer {
  border-top: 1px solid var(--line);
  padding: 19px 9px 0;
  font-size: 9px;
  color: var(--muted);
}
.live-dot,
.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7e946e;
  flex-shrink: 0;
}
.sidebar-footer .live-dot {
  margin-right: 5px;
}
.made-with {
  display: block;
  padding: 13px 0 0;
  font-size: 9px;
  color: #a2a398;
}
.made-with a {
  text-decoration: none;
  font-weight: 650;
  color: #64695d;
  margin-left: 2px;
  font-size: 12px;
  letter-spacing: -0.5px;
}
.workspace-main {
  margin-left: var(--sidebar);
}
.demo-strip {
  height: 35px;
  background: #eeefe6;
  border-bottom: 1px solid #e3e5da;
  padding: 0 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: #747767;
  gap: 12px;
}
.demo-tag {
  font-size: 8px;
  border: 1px solid #cfd3c1;
  color: #6e775e;
  border-radius: 3px;
  padding: 2px 4px;
  font-weight: 600;
  letter-spacing: 0.8px;
  margin-right: 8px;
}
.demo-strip .text-button {
  font-size: 9px;
  color: #6d7263;
}
.demo-strip .icon {
  width: 11px;
  height: 11px;
}
.topbar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
  border-bottom: 1px solid var(--line);
  background: #fbfbf7;
}
.breadcrumb {
  font-size: 11px;
  font-weight: 500;
  color: #666c61;
}
.breadcrumb span {
  margin: 0 12px;
  color: #b0b3a8;
}
.profile-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--muted);
}
.profile-switch select {
  border: 0;
  background: transparent;
  font-size: 11px;
  color: var(--ink);
  font-weight: 600;
  cursor: pointer;
  width: 130px;
  padding: 6px 0;
}
.profile-avatar {
  margin-left: 7px;
}
main {
  max-width: 1510px;
  margin: 0 auto;
  padding: 31px 34px 0;
  outline: none;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 25px;
}
.page-heading .eyebrow {
  font-size: 8px;
  letter-spacing: 1.7px;
  color: #929688;
  margin-bottom: 6px;
}
.page-heading h1 {
  font-size: 28px;
  font-weight: 550;
  letter-spacing: -1px;
  line-height: 1.3;
}
.page-heading p {
  font-size: 11px;
  color: var(--muted);
  margin-top: 7px;
}
.page-heading > .button {
  align-self: center;
}
.hero {
  border: 1px solid #e8e6dc;
  background: #eeeee5;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  padding: 29px 34px;
  margin-bottom: 20px;
  min-height: 236px;
}
.hero-copy {
  z-index: 1;
}
.hero .eyebrow {
  font-size: 8px;
  letter-spacing: 1.65px;
  color: #8b8d78;
}
.hero h2 {
  font-size: 37px;
  font-weight: 520;
  line-height: 1.12;
  letter-spacing: -1.6px;
  margin: 13px 0;
}
.hero h2 span {
  color: #66785d;
}
.hero-copy > p {
  font-size: 11px;
  line-height: 1.8;
  color: #7b7e6f;
}
.hero-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: #747b67;
  margin-top: 17px;
}
.hero-note .icon {
  width: 13px;
  height: 13px;
}
.hero-art {
  width: 35%;
  max-width: 390px;
  position: absolute;
  right: 40px;
  bottom: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 19px;
}
.landscape {
  width: 100%;
  height: auto;
  margin-bottom: 13px;
}
.art-caption {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  text-align: center;
  letter-spacing: 1.5px;
  font-size: 6px;
  color: #5d715b;
  font-weight: 600;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 17px 20px;
}
.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #747a6b;
}
.stat-top > .icon {
  width: 16px;
  height: 16px;
  color: #a3a594;
}
.stat-value {
  font-size: 32px;
  letter-spacing: -1px;
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-top: 8px;
}
.stat-value > span {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0;
  color: #919487;
}
.stat-bottom {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 9px;
  color: #8c8e80;
  margin-top: 12px;
  height: 22px;
}
.stat-bottom .avatar.small {
  width: 23px;
  height: 23px;
  font-size: 7px;
}
.avatar-stack {
  display: flex;
  align-items: center;
  padding-left: 4px;
}
.avatar-stack .avatar {
  margin-left: -4px;
  border: 2px solid white;
}
.orange-dot {
  background: #e39072;
}
.purple-dot {
  background: #ae9ac9;
}
.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.section-header h2 {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
.section-description {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.6;
  margin-top: 6px;
}
.planner-panel {
  margin-bottom: 22px;
}
.planner-heading {
  padding: 21px 23px 16px;
}
.planner-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}
.team-filter select {
  font-size: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px 24px 8px 11px;
  background: #fff;
  color: #6c7262;
  max-width: 170px;
  cursor: pointer;
}
.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}
.search-field .icon {
  width: 14px;
  height: 14px;
  color: #909486;
}
.search-field input {
  border: 0;
  outline: none;
  background: none;
  font-size: 10px;
  width: 130px;
  color: var(--ink);
}
.search-field input::placeholder {
  color: #999d8f;
}
.planner-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 20px 17px;
}
.range-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.range-controls strong {
  font-size: 11px;
  font-weight: 500;
  margin: 0 4px;
}
.range-controls .small-button {
  margin-left: 7px;
}
.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 8px;
  color: #939687;
}
.legend > span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.legend i {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  border: 1px solid #00000008;
}
.vacation {
  background: var(--peach);
  color: #b45835;
}
.personal {
  background: var(--purple);
  color: #88709e;
}
.sick {
  background: var(--green);
  color: #6b8653;
}
.timeline-scroll {
  overflow: auto;
  outline-offset: -3px;
}
.timeline {
  min-width: 720px;
}
.timeline-header,
.timeline-row {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
}
.timeline-header {
  border-block: 1px solid var(--line);
  background: #fdfdfb;
  height: 58px;
}
.team-column {
  font-size: 8px;
  letter-spacing: 1px;
  color: #9d9f92;
  font-weight: 550;
  padding: 24px 0 0 23px;
}
.team-column > span {
  display: inline-block;
  font-size: 8px;
  letter-spacing: 0;
  background: #f0f1ea;
  border-radius: 3px;
  padding: 2px 5px;
  margin-left: 5px;
  color: #919788;
}
.day-heads {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
}
.day-head {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  font-size: 8px;
  color: #9a9d90;
}
.day-head strong {
  font-size: 12px;
  font-weight: 500;
  color: #6b725f;
  min-width: 23px;
  height: 23px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.day-head.is-today {
  color: var(--orange);
  background: #f9f5ed;
}
.day-head.is-today strong {
  color: #fff;
  background: var(--orange);
  border-radius: 50%;
}
.week-divider {
  border-left: 1px dashed #d9decc !important;
}
.timeline-row {
  height: 58px;
  border-bottom: 1px solid #eff0e9;
}
.timeline-row:last-child {
  border-bottom: 0;
}
.teammate {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 0 22px;
  min-width: 0;
}
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  font-size: 9px;
  letter-spacing: 0.3px;
  font-weight: 600;
  flex-shrink: 0;
}
.avatar.small {
  width: 26px;
  height: 26px;
  font-size: 8px;
}
.avatar.orange {
  background: #f3dac8;
  color: #986b4f;
}
.avatar.purple {
  background: #e5dcf1;
  color: #7f6a9c;
}
.avatar.blue {
  background: #dce6eb;
  color: #637a8b;
}
.avatar.pink {
  background: #eddae0;
  color: #967084;
}
.avatar.green {
  background: #dfe7d3;
  color: #778265;
}
.avatar.yellow {
  background: #f0e6c8;
  color: #92814f;
}
.avatar.unassigned {
  background: #f3f3ed;
  color: #a3a596;
}
.teammate strong {
  display: block;
  font-weight: 550;
  font-size: 10px;
  white-space: nowrap;
}
.teammate small {
  display: block;
  color: #96998a;
  font-size: 8px;
  margin-top: 5px;
}
.teammate em {
  font-size: 7px;
  font-style: normal;
  color: #a4a796;
  background: #f1f3e9;
  padding: 2px 4px;
  border-radius: 3px;
  margin-left: 5px;
}
.track {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  grid-template-rows: 1fr;
  position: relative;
  align-items: center;
}
.grid-day {
  grid-row: 1;
  height: 100%;
  border-left: 1px solid #f2f3ee;
  pointer-events: none;
}
.grid-day.today-column {
  background: #fcf9f0;
}
.absence-bar {
  grid-row: 1;
  z-index: 1;
  margin: 0 5px;
  padding: 0 10px;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #00000004;
  border-radius: 5px;
  overflow: hidden;
  text-align: left;
  transition: filter 0.15s;
  font-size: 9px;
  font-weight: 500;
  min-width: 0;
  white-space: nowrap;
}
.absence-bar:hover {
  filter: brightness(0.97);
  border-color: #00000020;
}
.absence-bar .icon {
  width: 12px;
  height: 12px;
}
.bar-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-check {
  margin-left: auto;
  opacity: 0.6;
}
.one-day {
  padding: 0;
  justify-content: center;
}
.one-day .bar-label {
  display: none;
}
.planner-bottom {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  border-top: 1px solid var(--line);
  padding: 13px 23px;
  background: #fefefc;
  font-size: 8px;
  color: #9c9f90;
}
.planner-bottom .live-dot {
  width: 5px;
  height: 5px;
  margin-right: 4px;
  background: #a3b193;
}
.bottom-grid {
  display: grid;
  grid-template-columns: 1.36fr 1fr;
  gap: 20px;
  margin-bottom: 22px;
}
.coming-up > .section-header,
.handover-summary > .section-header {
  padding: 22px 23px 15px;
}
.mini-label {
  font-size: 8px;
  background: #f0f1ea;
  padding: 3px 5px;
  border-radius: 3px;
  color: #8e9581;
  margin-left: 5px;
  vertical-align: middle;
  letter-spacing: 0;
}
.upcoming-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px;
  width: 100%;
  text-align: left;
  background: none;
  border-top: 1px solid #f0f0e9;
}
.upcoming-row:hover {
  background: #fdfdf8;
}
.upcoming-person {
  flex: 1;
}
.upcoming-person strong {
  display: block;
  font-size: 10px;
  font-weight: 550;
}
.upcoming-person small {
  display: block;
  font-size: 8px;
  color: #9a9f8e;
  margin-top: 5px;
}
.upcoming-dates {
  text-align: right;
  white-space: nowrap;
}
.upcoming-dates strong {
  display: block;
  font-size: 9px;
  font-weight: 500;
}
.upcoming-dates small {
  display: block;
  font-size: 8px;
  color: #9a9f8e;
  margin-top: 5px;
}
.upcoming-row .type-badge {
  margin-left: 2px;
}
.upcoming-row > .icon {
  width: 12px;
  height: 12px;
  color: #b4b8a8;
}
.type-badge {
  font-size: 8px;
  display: inline-flex;
  padding: 5px 7px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 500;
}
.handover-summary {
  padding-bottom: 17px;
}
.soft-icon {
  color: #7a8769;
}
.soft-icon .icon {
  width: 17px;
  height: 17px;
}
.handover-summary > .section-description {
  padding: 0 23px;
  margin-top: -5px;
  margin-bottom: 12px;
}
.handover-mini {
  width: calc(100% - 44px);
  margin: 0 22px;
  padding: 11px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  text-align: left;
  border-bottom: 1px solid #f0f1e9;
}
.handover-mini:hover strong {
  color: var(--orange);
}
.handover-mini strong {
  display: block;
  font-size: 10px;
  font-weight: 550;
}
.handover-mini small {
  display: block;
  font-size: 8px;
  color: #9b9e8f;
  margin-top: 5px;
}
.handover-state {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #edf1e8;
  color: #899779;
}
.handover-state .icon {
  width: 13px;
  height: 13px;
}
.handover-state.needs-cover {
  background: #fbefe0;
  color: #ba9662;
}
.mini-status {
  margin-left: auto;
  color: #95a085;
  font-size: 8px;
}
.handover-link {
  margin: 16px 23px 0;
  font-size: 10px;
}
.applet-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px dashed #d8dccd;
  border-radius: 10px;
  padding: 23px;
  background: #f0f2e9;
}
.banner-icon {
  color: #77846a;
  background: #e6eadc;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
}
.banner-icon .icon {
  width: 20px;
  height: 20px;
}
.applet-banner h3 {
  font-size: 13px;
  font-weight: 550;
  letter-spacing: -0.2px;
}
.applet-banner p {
  font-size: 10px;
  color: #8b9280;
  line-height: 1.6;
  margin-top: 5px;
}
.applet-banner .button {
  font-size: 10px;
  margin-left: auto;
  padding: 9px 12px;
  background: transparent;
  color: #667557;
  border-color: #cfd6c1;
}
.page-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 8px;
  color: #a1a593;
  padding: 25px 0 24px;
}
.planner-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border: 1px dashed #d8dccd;
  background: #f0f2e9;
  border-radius: 10px;
  font-size: 11px;
  color: #8c9481;
  line-height: 1.7;
}
.planner-tip .icon {
  color: #839273;
}
.planner-tip strong {
  color: #65725a;
  font-weight: 500;
}
.my-intro {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 25px;
  background: #edeee5;
  border: 1px solid #e0e4d6;
  border-radius: 12px;
  margin-bottom: 25px;
}
.my-intro > .avatar {
  width: 42px;
  height: 42px;
  font-size: 13px;
}
.my-intro strong {
  font-size: 14px;
  font-weight: 550;
}
.my-intro p {
  font-size: 11px;
  color: #8b9280;
  margin-top: 6px;
}
.no-approval {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #809170;
  font-size: 10px;
}
.no-approval .icon {
  width: 15px;
  height: 15px;
}
.list-panel {
  margin-bottom: 24px;
}
.list-panel > .section-header {
  padding: 22px 25px;
  border-bottom: 1px solid var(--line);
}
.absence-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 24px;
  text-align: left;
  background: none;
  border-bottom: 1px solid #eeefe6;
}
.absence-card:hover {
  background: #fdfdf9;
}
.absence-card:last-child {
  border-bottom: none;
}
.absence-card-icon {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  flex-shrink: 0;
}
.absence-card-main {
  flex: 1;
}
.absence-card-main h3 {
  font-size: 14px;
  font-weight: 550;
}
.absence-card-main p {
  font-size: 11px;
  color: #919786;
  margin-top: 7px;
  line-height: 1.5;
}
.absence-card-main p span {
  padding: 0 6px;
}
.absence-card > .icon {
  width: 16px;
  height: 16px;
  color: #aab09d;
}
.coverage-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f7f0e5;
  color: #b99a67;
  font-size: 9px;
  padding: 6px 8px;
  border-radius: 5px;
  white-space: nowrap;
}
.coverage-badge.covered {
  color: #80956d;
  background: #edf3e7;
}
.coverage-badge .icon {
  width: 13px;
  height: 13px;
}
.empty-state {
  text-align: center;
  padding: 55px 20px;
}
.empty-state > .icon {
  width: 31px;
  height: 31px;
  color: #aaa78c;
  margin-bottom: 15px;
}
.empty-state h3 {
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.3px;
}
.empty-state p {
  font-size: 11px;
  color: #9a9e8b;
  line-height: 1.7;
  margin: 9px 0 20px;
}
.past-panel {
  opacity: 0.8;
}
.handover-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 14px;
}
.segmented {
  display: inline-flex;
  padding: 4px;
  background: #eaece2;
  border-radius: 8px;
}
.segment {
  background: none;
  padding: 10px 14px;
  font-size: 11px;
  border-radius: 6px;
  color: #8d9580;
}
.segment.selected {
  background: #fff;
  color: #5b6a4f;
  box-shadow: 0 1px 3px #33421e08;
}
.segment:hover {
  color: var(--ink);
}
.handover-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.handover-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.handover-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.handover-card-top .muted {
  font-size: 9px;
}
.handover-card h2 {
  font-size: 19px;
  letter-spacing: -0.5px;
  font-weight: 550;
  margin-top: 22px;
}
.handover-notes {
  font-size: 12px;
  line-height: 1.8;
  color: #8a9280;
  margin-top: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  flex: 1;
}
.handover-people {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.handover-people > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.handover-people small {
  display: block;
  font-size: 8px;
  color: #a0a592;
  margin-bottom: 4px;
}
.handover-people strong {
  font-size: 9px;
  font-weight: 500;
  display: block;
}
.handover-people > .icon {
  width: 14px;
  height: 14px;
  color: #b4b9a8;
}
.handover-card-footer {
  margin-top: 23px;
}
.handover-card-footer .text-button {
  font-size: 10px;
  color: #6d7e5e;
}
.modal {
  padding: 34px;
  max-width: 520px;
  width: calc(100% - 32px);
  border: 1px solid #e1e3d7;
  border-radius: 17px;
  box-shadow: 0 20px 90px #28322225;
  background: #fff;
  color: var(--ink);
  max-height: calc(100dvh - 40px);
  overflow: auto;
  animation: modal-in 0.15s ease-out;
}
.modal::backdrop {
  background: #20261fcc;
  backdrop-filter: blur(3px);
}
.modal-close {
  position: absolute;
  right: 15px;
  top: 14px;
  color: #939a87;
}
.dialog-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 8px;
  letter-spacing: 1.5px;
  font-weight: 600;
  color: #b97757;
  margin-bottom: 14px;
}
.dialog-eyebrow > .icon {
  width: 17px;
  height: 17px;
}
.modal h2 {
  font-size: 28px;
  font-weight: 550;
  letter-spacing: -1px;
  line-height: 1.2;
  padding-right: 15px;
}
.dialog-description {
  font-size: 12px;
  color: #8e9583;
  line-height: 1.7;
  margin-top: 10px;
}
.form-person {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 0 20px;
  font-size: 11px;
  color: #9aa28d;
}
.form-person strong {
  font-weight: 500;
  color: #647157;
}
form > label,
.form-row > label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 10px;
  font-weight: 550;
  color: #6e795f;
  margin-bottom: 15px;
}
form select,
form input:not([type='checkbox']),
form textarea {
  width: 100%;
  border: 1px solid #dfe4d4;
  border-radius: 7px;
  padding: 11px 12px;
  font-size: 12px;
  color: #5b674f;
  background: #fff;
  min-width: 0;
}
form textarea {
  resize: vertical;
  line-height: 1.6;
}
form input::placeholder,
form textarea::placeholder {
  color: #acb29f;
  font-size: 11px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.day-estimate {
  font-size: 9px;
  color: #99a28a;
  background: #f7f8f2;
  border-radius: 5px;
  padding: 10px 11px;
  margin: -4px 0 22px;
}
.form-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  border-top: 1px solid var(--line);
  padding-top: 20px;
  margin-bottom: 18px;
}
.form-section-title > span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-section-title .icon {
  width: 17px;
  height: 17px;
  color: #8b9b78;
}
.form-section-title small {
  font-size: 9px;
  font-weight: 400;
  color: #adb59d;
}
form > .checkbox-label {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  font-weight: 500;
  line-height: 1.5;
  font-size: 11px;
  margin-top: 5px;
}
.checkbox-label input {
  margin-top: 1px;
  accent-color: var(--orange);
}
.checkbox-label small {
  display: block;
  font-size: 9px;
  color: #a1a990;
  font-weight: 400;
  margin-top: 3px;
}
.form-error {
  font-size: 11px;
  color: #c8593b;
  line-height: 1.7;
  margin-top: 12px;
  white-space: pre-wrap;
}
.form-error:empty {
  display: none;
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.form-disclaimer {
  font-size: 8px;
  color: #acb29f;
  text-align: center;
  line-height: 1.6;
  margin-top: 14px;
}
.detail-person {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
}
.detail-person > .avatar {
  width: 46px;
  height: 46px;
  font-size: 13px;
}
.detail-person .eyebrow {
  font-size: 8px;
}
.detail-person h2 {
  font-size: 23px;
  margin-top: 4px;
}
.detail-person p {
  font-size: 11px;
  color: #9ba38c;
  margin-top: 6px;
}
.detail-absence {
  background: #f7f8f1;
  border: 1px solid #eaeddf;
  border-radius: 11px;
  padding: 21px;
  margin: 25px 0;
}
.detail-absence .type-badge {
  font-size: 9px;
}
.detail-absence h3 {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.6px;
  margin-top: 13px;
}
.detail-absence p {
  font-size: 11px;
  color: #9ca58d;
  margin-top: 8px;
}
.detail-handover .section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 550;
}
.detail-handover .section-header h3 > .icon {
  color: #8d9c7b;
  width: 17px;
  height: 17px;
}
.detail-handover h4 {
  font-size: 14px;
  font-weight: 500;
  margin-top: 21px;
}
.detail-notes {
  font-size: 12px;
  line-height: 1.85;
  color: #8e9880;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-top: 12px;
}
.detail-cover {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 20px;
  padding-top: 17px;
  border-top: 1px dashed var(--line);
}
.detail-cover small {
  display: block;
  font-size: 8px;
  color: #a6ae98;
  margin-bottom: 5px;
}
.detail-cover strong {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #7e8a6d;
}
.danger {
  color: #bf725c;
}
.danger-button {
  background: #c65c3e;
  color: #fff;
  border-color: #c65c3e;
}
.danger-button:hover {
  background: #b04c31;
}
.story-modal {
  max-width: 610px;
  padding: 38px;
}
.story-modal h2 {
  font-size: 32px;
  line-height: 1.16;
}
.story-lead {
  font-size: 13px;
  color: #8b957d;
  line-height: 1.85;
  margin-top: 18px;
}
.story-steps {
  margin-top: 25px;
  border-top: 1px solid var(--line);
}
.story-steps > div {
  padding: 18px 0 18px 35px;
  border-bottom: 1px solid var(--line);
  position: relative;
}
.story-steps > div > span {
  position: absolute;
  left: 0;
  top: 20px;
  font-size: 9px;
  color: #ca9b7d;
}
.story-steps h3 {
  font-size: 13px;
  font-weight: 550;
}
.story-steps p {
  font-size: 11px;
  line-height: 1.8;
  color: #98a188;
  margin-top: 6px;
}
.integration-ideas {
  background: #f3f5ed;
  border: 1px dashed #d7decc;
  border-radius: 9px;
  padding: 19px;
  margin-top: 25px;
}
.integration-ideas .eyebrow {
  font-size: 8px;
  letter-spacing: 1.3px;
  color: #8b987b;
}
.integration-ideas > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
  color: #8e9b7c;
  font-size: 10px;
}
.integration-ideas > div > span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.integration-ideas .icon {
  width: 14px;
  height: 14px;
}
.integration-ideas p {
  font-size: 9px;
  color: #9fa98f;
  margin-top: 15px;
  line-height: 1.7;
}
.story-modal .dialog-footer > .muted {
  font-size: 10px;
}
.demo-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
}
.demo-list li {
  font-size: 12px;
  color: #919b82;
  line-height: 1.8;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}
.demo-list strong {
  color: #5c6b4e;
  font-weight: 550;
}
.toast.visible {
  position: fixed;
  bottom: 25px;
  left: calc(50% + var(--sidebar) / 2);
  transform: translateX(-50%);
  z-index: 50;
  background: #394335;
  color: #f2f5ed;
  box-shadow: 0 8px 30px #24301b20;
  border-radius: 10px;
  padding: 15px 23px;
  font-size: 12px;
  line-height: 1.6;
  max-width: calc(100% - 30px);
  width: max-content;
}
.toast.toast-error {
  background: #a84f36;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Keep everyday information readable, even in the compact planner. */
.brand-caption {
  font-size: 5.5px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.nav-item {
  font-size: 13px;
}
.breadcrumb {
  font-size: 12px;
}
.demo-strip {
  font-size: 11px;
}
.page-heading p {
  font-size: 12px;
}
.hero-copy > p {
  font-size: 12px;
}
.hero-note {
  font-size: 10px;
}
.stat-top {
  font-size: 12px;
}
.stat-value > span {
  font-size: 11px;
}
.stat-bottom {
  font-size: 10px;
  color: #727967;
}
.section-header h2 {
  font-size: 16px;
}
.section-description {
  font-size: 11px;
}
.team-filter select {
  font-size: 11px;
}
.range-controls strong {
  font-size: 12px;
}
.legend {
  font-size: 9px;
}
.team-column {
  font-size: 9px;
}
.day-head {
  font-size: 10px;
}
.day-head strong {
  font-size: 13px;
}
.teammate strong {
  font-size: 12px;
}
.teammate small {
  font-size: 10px;
  color: #79816e;
}
.teammate em {
  font-size: 8px;
}
.absence-bar {
  font-size: 11px;
}
.planner-bottom {
  font-size: 9px;
  color: #77816a;
}
.upcoming-person strong {
  font-size: 12px;
}
.upcoming-person small {
  font-size: 10px;
  color: #79816e;
}
.upcoming-dates strong {
  font-size: 11px;
}
.upcoming-dates small {
  font-size: 9px;
  color: #79816e;
}
.type-badge {
  font-size: 9px;
}
.handover-mini strong {
  font-size: 12px;
}
.handover-mini small {
  font-size: 10px;
  color: #79816e;
}
.mini-status {
  font-size: 9px;
  color: #687f55;
}
.handover-link {
  font-size: 11px;
}
.applet-banner h3 {
  font-size: 14px;
}
.applet-banner p {
  font-size: 11px;
  color: #758466;
}
.handover-notes,
.detail-notes,
.story-lead,
.demo-list li {
  color: #737f64;
}
.day-estimate {
  color: #758466;
}
.form-disclaimer {
  color: #737f64;
}
.toast.visible {
  font-size: 13px;
}
@media (min-width: 1550px) {
  main {
    padding: 40px 48px 0;
  }
  .hero {
    min-height: 265px;
  }
  .hero h2 {
    font-size: 44px;
  }
  .hero-art {
    right: 75px;
  }
  .timeline-row {
    height: 65px;
  }
  .timeline-header,
  .timeline-row {
    grid-template-columns: 215px minmax(0, 1fr);
  }
  .teammate strong {
    font-size: 11px;
  }
  .teammate small {
    font-size: 9px;
  }
  .hero-copy > p {
    font-size: 12px;
  }
  .stat-card {
    padding: 20px 25px;
  }
  .page-heading h1 {
    font-size: 32px;
  }
  .topbar,
  .demo-strip {
    padding-inline: 48px;
  }
  .brand-caption {
    font-size: 6px;
  }
}
@media (max-width: 1150px) {
  :root {
    --sidebar: 195px;
  }
  .sidebar {
    padding-inline: 13px;
  }
  .sidebar .brand {
    font-size: 28px;
  }
  .brand-caption {
    font-size: 5.5px;
  }
  .workspace {
    padding: 11px 8px;
  }
  .nav-item {
    font-size: 11px;
  }
  .topbar,
  .demo-strip {
    padding-inline: 24px;
  }
  main {
    padding: 27px 24px 0;
  }
  .hero {
    padding: 27px;
  }
  .hero-art {
    right: 18px;
    width: 36%;
  }
  .hero h2 {
    font-size: 33px;
  }
  .stat-card {
    padding: 15px;
  }
  .stat-value {
    font-size: 29px;
  }
  .stat-value > span {
    font-size: 9px;
  }
  .stat-bottom {
    font-size: 8px;
  }
  .timeline-header,
  .timeline-row {
    grid-template-columns: 176px minmax(0, 1fr);
  }
  .teammate {
    padding-left: 18px;
    gap: 8px;
  }
  .team-column {
    padding-left: 18px;
  }
  .teammate strong {
    font-size: 9px;
  }
  .teammate small {
    font-size: 7px;
  }
  .absence-bar {
    font-size: 8px;
    padding-inline: 7px;
    margin-inline: 4px;
  }
  .one-day {
    padding: 0;
  }
  .legend {
    gap: 8px;
    font-size: 7px;
  }
  .range-controls strong {
    font-size: 10px;
  }
  .planner-period {
    padding-inline: 14px;
  }
  .bottom-grid {
    grid-template-columns: 1.2fr 1fr;
    gap: 15px;
  }
  .upcoming-row {
    padding: 16px;
    gap: 8px;
  }
  .upcoming-row .type-badge {
    display: none;
  }
  .applet-banner {
    padding: 18px;
    gap: 12px;
  }
  .applet-banner p {
    font-size: 9px;
  }
  .handover-cards {
    gap: 15px;
  }
  .handover-card {
    padding: 20px;
  }
  .handover-people {
    gap: 5px;
  }
  .handover-people > div {
    gap: 5px;
  }
  .handover-people strong {
    font-size: 8px;
  }
  .handover-card-top .muted {
    font-size: 8px;
  }
}
@media (max-width: 900px) {
  :root {
    --sidebar: 180px;
  }
  .brand {
    padding-left: 4px;
    font-size: 25px !important;
    gap: 8px;
  }
  .brand-mark {
    width: 33px;
    height: 35px;
    font-size: 29px;
  }
  .brand-caption {
    font-size: 5px;
  }
  .sidebar-story {
    padding-left: 8px;
  }
  .sidebar-story h3 {
    font-size: 16px;
  }
  .hero h2 {
    font-size: 30px;
  }
  .hero-art {
    right: 12px;
    width: 35%;
  }
  .hero-copy > p {
    font-size: 10px;
  }
  .stat-value {
    font-size: 25px;
    gap: 7px;
  }
  .stat-value > span {
    font-size: 8px;
  }
  .stat-bottom .avatar-stack {
    display: none;
  }
  .stats {
    gap: 10px;
  }
  .stat-card {
    padding: 15px 12px;
  }
  .hero {
    min-height: 227px;
  }
  .page-heading h1 {
    font-size: 25px;
  }
  .planner-tools {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .search-field input {
    width: 100px;
  }
  .planner-period {
    flex-wrap: wrap;
    row-gap: 10px;
  }
  .legend {
    margin-left: 8px;
  }
  .timeline {
    min-width: 710px;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .upcoming-row .type-badge {
    display: inline-flex;
  }
  .handover-cards {
    grid-template-columns: 1fr;
  }
  .applet-banner {
    flex-wrap: wrap;
  }
  .applet-banner .button {
    margin-left: 48px;
  }
  .no-approval {
    display: none;
  }
  .segment {
    padding-inline: 10px;
    font-size: 10px;
  }
  .handover-toolbar {
    flex-wrap: wrap;
  }
  .absence-card {
    gap: 12px;
    padding: 20px;
  }
  .absence-card .coverage-badge {
    display: none;
  }
}
@media (max-width: 700px) {
  :root {
    --sidebar: 0px;
  }
  .sidebar {
    position: sticky;
    top: 0;
    width: 100%;
    padding: 12px 18px 0;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    background: #fafaf6f5;
    backdrop-filter: blur(12px);
  }
  .sidebar .brand {
    font-size: 24px !important;
    gap: 8px;
    padding: 0;
  }
  .brand-mark {
    width: 29px;
    height: 30px;
    font-size: 26px;
    border-radius: 8px;
  }
  .brand-mark span {
    width: 5px;
    height: 5px;
    top: 6px;
    right: 4px;
  }
  .brand-caption {
    display: none;
  }
  .workspace {
    margin: 0 0 0 auto;
    padding: 0;
    border: 0;
    background: none;
    gap: 6px;
  }
  .workspace-logo {
    height: 24px;
    width: 24px;
    font-size: 19px;
    border-radius: 5px;
  }
  .workspace strong {
    font-size: 10px;
  }
  .workspace small,
  .workspace-dots {
    display: none;
  }
  .nav-label,
  .sidebar-story,
  .sidebar-footer {
    display: none;
  }
  .sidebar nav {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    gap: 5px;
  }
  .nav-item {
    width: auto;
    padding: 10px 7px;
    border-radius: 6px 6px 0 0;
    gap: 6px;
    font-size: 10px;
    margin-bottom: 0;
    justify-content: center;
    flex: 1;
  }
  .nav-item .icon {
    width: 14px;
    height: 14px;
  }
  .nav-count {
    font-size: 7px;
    margin-left: 0;
  }
  .workspace-main {
    margin-left: 0;
  }
  .demo-strip {
    padding-inline: 20px;
    height: 32px;
    font-size: 8px;
  }
  .demo-tag {
    font-size: 6px;
    margin-right: 5px;
  }
  .demo-strip .text-button {
    font-size: 8px;
  }
  .topbar {
    height: 57px;
    padding-inline: 20px;
  }
  .breadcrumb {
    font-size: 9px;
  }
  .breadcrumb span {
    margin: 0 5px;
  }
  .profile-switch {
    font-size: 8px;
    gap: 4px;
  }
  .profile-switch select {
    width: 107px;
    font-size: 9px;
  }
  .profile-avatar {
    margin-left: 3px;
  }
  .profile-avatar .avatar {
    width: 23px;
    height: 23px;
    font-size: 7px;
  }
  main {
    padding: 25px 20px 0;
  }
  .page-heading {
    margin-bottom: 22px;
    gap: 10px;
  }
  .page-heading .eyebrow {
    font-size: 7px;
    letter-spacing: 1.3px;
  }
  .page-heading h1 {
    font-size: 24px;
    letter-spacing: -0.7px;
  }
  .page-heading p {
    font-size: 9px;
    max-width: 230px;
    line-height: 1.6;
  }
  .page-heading > .button {
    font-size: 10px;
    padding: 10px 12px;
    gap: 5px;
  }
  .page-heading > .button .icon {
    width: 14px;
    height: 14px;
  }
  .hero {
    min-height: 223px;
    padding: 23px;
    align-items: flex-start;
  }
  .hero h2 {
    font-size: 28px;
    letter-spacing: -1px;
    line-height: 1.17;
  }
  .hero .eyebrow {
    font-size: 7px;
    letter-spacing: 1.2px;
  }
  .hero-copy > p {
    font-size: 9px;
    line-height: 1.9;
    max-width: 240px;
  }
  .hero-art {
    right: -13px;
    width: 34%;
    opacity: 0.8;
    padding-bottom: 30px;
  }
  .art-caption {
    display: none;
  }
  .hero-note {
    font-size: 8px;
    gap: 4px;
    max-width: 200px;
  }
  .stats {
    gap: 8px;
    margin-bottom: 21px;
  }
  .stat-card {
    padding: 12px 9px;
    border-radius: 9px;
  }
  .stat-top {
    font-size: 8px;
    gap: 3px;
  }
  .stat-top > .icon {
    width: 12px;
    height: 12px;
  }
  .stat-value {
    font-size: 25px;
    margin-top: 9px;
    display: block;
    line-height: 1.2;
  }
  .stat-value > span {
    font-size: 7px;
    display: block;
    letter-spacing: 0;
    margin-top: 4px;
  }
  .stat-bottom {
    height: auto;
    font-size: 7px;
    line-height: 1.5;
    align-items: flex-start;
    gap: 4px;
    margin-top: 10px;
  }
  .stat-bottom .status-dot {
    margin-top: 3px;
    width: 4px;
    height: 4px;
  }
  .planner-heading {
    padding: 18px 17px 14px;
    align-items: flex-start;
  }
  .section-header h2 {
    font-size: 13px;
  }
  .section-description {
    font-size: 9px;
  }
  .team-filter select {
    font-size: 9px;
    padding: 7px 18px 7px 8px;
    max-width: 112px;
  }
  .planner-tools {
    max-width: 160px;
  }
  .search-field {
    padding: 6px 8px;
  }
  .search-field input {
    width: 110px;
    font-size: 9px;
  }
  .planner-period {
    padding: 0 12px 14px;
    gap: 10px;
  }
  .range-controls strong {
    font-size: 9px;
    margin-inline: 0;
  }
  .range-controls {
    gap: 1px;
  }
  .range-controls .small-button {
    margin-left: 4px;
  }
  .range-controls .icon-button {
    width: 23px;
    height: 27px;
  }
  .legend {
    font-size: 7px;
    margin-left: 5px;
    gap: 14px;
  }
  .timeline-scroll {
    border-top: 1px solid var(--line);
  }
  .timeline-header {
    border-top: 0;
  }
  .timeline {
    min-width: 710px;
  }
  .teammate {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #fff;
    border-right: 1px solid var(--line);
    padding-left: 16px;
  }
  .team-column {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #fdfdfb;
  }
  .timeline-row {
    height: 55px;
  }
  .timeline-header,
  .timeline-row {
    grid-template-columns: 165px minmax(0, 1fr);
  }
  .planner-bottom {
    padding: 12px 15px;
    font-size: 7px;
    gap: 8px;
  }
  .coming-up > .section-header,
  .handover-summary > .section-header {
    padding: 20px 18px 15px;
  }
  .upcoming-row {
    padding: 15px 18px;
  }
  .upcoming-person strong {
    font-size: 9px;
  }
  .upcoming-person small {
    font-size: 7px;
  }
  .upcoming-dates strong {
    font-size: 8px;
  }
  .upcoming-row .type-badge {
    font-size: 7px;
    padding: 4px 5px;
  }
  .upcoming-row > .avatar {
    width: 27px;
    height: 27px;
    font-size: 8px;
  }
  .upcoming-row > .icon {
    display: none;
  }
  .handover-summary > .section-description {
    padding-inline: 18px;
  }
  .handover-mini {
    width: calc(100% - 36px);
    margin-inline: 18px;
  }
  .handover-link {
    margin-left: 18px;
  }
  .applet-banner {
    gap: 12px;
    padding: 18px;
  }
  .applet-banner > div {
    flex: 1;
  }
  .applet-banner h3 {
    font-size: 12px;
  }
  .applet-banner p {
    font-size: 9px;
  }
  .applet-banner .button {
    font-size: 9px;
    margin-left: 48px;
  }
  .page-footer {
    font-size: 7px;
    line-height: 1.8;
    gap: 15px;
  }
  .page-footer span:last-child {
    text-align: right;
  }
  .my-intro {
    padding: 20px;
  }
  .my-intro p {
    font-size: 10px;
    line-height: 1.7;
  }
  .absence-card {
    padding: 19px 16px;
    gap: 12px;
  }
  .absence-card-icon {
    width: 35px;
    height: 35px;
  }
  .absence-card-main h3 {
    font-size: 13px;
  }
  .absence-card-main p {
    font-size: 10px;
  }
  .handover-toolbar .muted {
    font-size: 10px;
  }
  .segmented {
    width: 100%;
    justify-content: space-between;
  }
  .segment {
    padding: 9px 10px;
    font-size: 9px;
    flex: 1;
  }
  .handover-card {
    padding: 22px;
  }
  .handover-card-top .muted {
    font-size: 9px;
  }
  .handover-people strong {
    font-size: 9px;
  }
  .handover-people > div {
    gap: 8px;
  }
  .planner-tip {
    padding: 20px;
    font-size: 10px;
  }
  .empty-state {
    padding: 40px 18px;
  }
  .empty-state h3 {
    font-size: 16px;
  }
  .empty-state p {
    font-size: 10px;
  }
  .modal {
    padding: 26px 22px;
    max-height: calc(100dvh - 28px);
  }
  .modal h2 {
    font-size: 24px;
  }
  .dialog-description {
    font-size: 11px;
  }
  .story-modal h2 {
    font-size: 28px;
  }
  .story-lead {
    font-size: 12px;
  }
  .story-modal .dialog-footer {
    flex-wrap: wrap;
  }
  .story-modal .dialog-footer .button {
    margin-left: auto;
  }
  .integration-ideas {
    padding: 15px;
  }
  .integration-ideas > div {
    font-size: 9px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .form-row {
    gap: 10px;
  }
  form input[type='date'] {
    padding: 10px 7px;
    font-size: 11px;
  }
  .toast.visible {
    font-size: 11px;
    padding: 13px 18px;
    bottom: 16px;
  }
}
@media (max-width: 700px) {
  .applet-banner {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
  }
  .applet-banner > div {
    min-width: 0;
  }
  .applet-banner .button {
    grid-column: 2;
    justify-self: start;
    margin: 0;
  }
  .teammate strong {
    font-size: 10px;
  }
  .teammate small {
    font-size: 9px;
  }
  .upcoming-person small {
    font-size: 9px;
  }
  .stat-top {
    font-size: 9px;
  }
  .stat-value > span,
  .stat-bottom {
    font-size: 8px;
  }
  .hero-copy > p {
    font-size: 10px;
    max-width: 230px;
  }
  .nav-item {
    min-height: 40px;
  }
  .page-heading > .button {
    min-height: 40px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;
