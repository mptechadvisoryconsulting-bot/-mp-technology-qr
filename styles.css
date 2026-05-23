:root {
  color-scheme: light;
  --ink: #111827;
  --muted: #667085;
  --line: #d7dee8;
  --panel: #ffffff;
  --page: #f5f7fb;
  --accent: #0f766e;
  --accent-strong: #0b5d57;
  --accent-soft: #e6f5f3;
  --rose: #b42355;
  --sun: #aa6b00;
  --shadow: 0 18px 46px rgba(17, 24, 39, 0.1);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  color: var(--ink);
  background:
    linear-gradient(180deg, #eaf3f1 0, #f7f8fb 360px),
    var(--page);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
}

.workspace {
  width: min(1380px, 100%);
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 26px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 1.06rem;
  font-weight: 850;
}

.brand-logo {
  width: 58px;
  height: 38px;
  object-fit: contain;
  border-radius: 7px;
  background: #111827;
  box-shadow: 0 8px 22px rgba(0, 148, 255, 0.18);
}

nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

nav a {
  padding: 8px 11px;
  border-radius: 6px;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 760;
}

nav a:hover,
nav a:focus-visible {
  color: var(--ink);
  background: #fff;
  outline: none;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 0.48fr);
  gap: 24px;
  align-items: end;
  margin-bottom: 18px;
}

.hero h1 {
  max-width: 920px;
  margin: 4px 0 0;
  font-size: clamp(2.25rem, 5vw, 5rem);
  line-height: 0.98;
  letter-spacing: 0;
}

.eyebrow {
  margin: 0;
  color: var(--sun);
  font-size: 0.74rem;
  font-weight: 860;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.trust-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: var(--shadow);
}

.trust-strip div {
  min-width: 0;
  padding: 16px;
  border-left: 1px solid var(--line);
}

.trust-strip div:first-child {
  border-left: 0;
}

.trust-strip span {
  display: block;
  overflow: hidden;
  font-size: 1.32rem;
  font-weight: 880;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trust-strip small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 760;
  text-transform: uppercase;
}

.generator-grid,
.tool-grid {
  display: grid;
  gap: 16px;
  align-items: start;
}

.generator-grid {
  grid-template-columns: minmax(420px, 0.92fr) minmax(360px, 0.55fr);
}

.tool-grid {
  grid-template-columns: minmax(420px, 0.82fr) minmax(360px, 0.65fr);
  margin-top: 16px;
}

.panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(215, 222, 232, 0.96);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.panel-heading,
.status-row,
.export-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading {
  margin-bottom: 14px;
}

h2 {
  margin: 4px 0 0;
  font-size: 1.1rem;
  line-height: 1.25;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(72px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.type-grid label {
  min-width: 0;
}

.type-grid input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.type-grid span {
  display: grid;
  min-height: 42px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #344054;
  background: #f8fafc;
  font-size: 0.82rem;
  font-weight: 830;
}

.type-grid input:checked + span {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.dynamic-fields {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span,
.status-row,
.recent-meta {
  color: #344054;
  font-size: 0.82rem;
  font-weight: 780;
}

.field.wide {
  grid-column: 1 / -1;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

input,
textarea,
select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--ink);
  background: #fff;
  outline: none;
}

input,
select {
  padding: 9px 10px;
}

input[type="color"] {
  min-height: 42px;
  padding: 4px;
}

input[type="range"] {
  padding: 0;
  accent-color: var(--accent);
}

textarea {
  min-height: 150px;
  padding: 11px 12px;
  resize: vertical;
  line-height: 1.45;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.brand-control {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.brand-control.wide {
  grid-column: 1 / -1;
}

.logo-preview {
  display: grid;
  min-height: 82px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #111827;
}

.logo-preview img {
  max-width: 100%;
  max-height: 78px;
  object-fit: contain;
}

.logo-preview.is-empty {
  background: #f8fafc;
}

.logo-preview.is-empty::before {
  content: "No logo";
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 820;
}

.logo-preview.is-empty img {
  display: none;
}

.logo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-button,
.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 0;
  border-radius: 7px;
  font-weight: 850;
}

.icon-button {
  width: 40px;
  color: var(--ink);
  background: #edf1f5;
}

.primary-button {
  color: #fff;
  background: var(--accent);
  padding: 0 14px;
}

.secondary-button {
  color: var(--ink);
  background: #edf1f5;
  padding: 0 13px;
}

.file-button {
  user-select: none;
}

.primary-button:hover,
.primary-button:focus-visible {
  background: var(--accent-strong);
}

.secondary-button:hover,
.secondary-button:focus-visible,
.icon-button:hover,
.icon-button:focus-visible {
  background: #dfe7ed;
}

button svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

i[data-lucide] {
  display: inline-flex;
  width: 18px;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-style: normal;
}

i[data-lucide]::before {
  content: attr(data-lucide);
  font-size: 0.54rem;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--accent-strong);
  background: var(--accent-soft);
  font-size: 0.76rem;
  font-weight: 850;
  white-space: nowrap;
}

.qr-stage {
  position: relative;
  display: grid;
  min-height: 420px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(45deg, #f4f6f8 25%, transparent 25%),
    linear-gradient(-45deg, #f4f6f8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f4f6f8 75%),
    linear-gradient(-45deg, transparent 75%, #f4f6f8 75%),
    #fff;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-size: 20px 20px;
}

#qr-canvas {
  width: min(78vw, 360px);
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.16);
}

.empty-preview {
  position: absolute;
  display: none;
  max-width: 260px;
  padding: 14px;
  border-radius: 8px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.92);
  text-align: center;
  line-height: 1.45;
  font-weight: 760;
}

.preview-empty #qr-canvas {
  opacity: 0;
}

.preview-empty .empty-preview {
  display: block;
}

.export-actions {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 14px;
}

.recent-list {
  display: grid;
  gap: 10px;
}

.recent-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfe;
}

.recent-title {
  overflow: hidden;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  margin-top: 2px;
  color: var(--muted);
  font-size: 0.76rem;
}

.empty-list {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

@media (max-width: 1120px) {
  .hero,
  .generator-grid,
  .tool-grid {
    grid-template-columns: 1fr;
  }

  .type-grid {
    grid-template-columns: repeat(4, minmax(72px, 1fr));
  }
}

@media (max-width: 720px) {
  .app-shell {
    padding: 14px;
  }

  .topbar,
  .panel-heading,
  .status-row {
    align-items: flex-start;
    flex-direction: column;
  }

  nav {
    justify-content: flex-start;
  }

  .hero h1 {
    font-size: clamp(2rem, 12vw, 3.4rem);
  }

  .trust-strip,
  .type-grid,
  .control-grid,
  .two-col,
  .brand-control {
    grid-template-columns: 1fr;
  }

  .trust-strip div {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .trust-strip div:first-child {
    border-top: 0;
  }

  .panel {
    padding: 15px;
  }

  .primary-button,
  .secondary-button,
  .export-actions {
    width: 100%;
  }

  .qr-stage {
    min-height: 340px;
  }
}
