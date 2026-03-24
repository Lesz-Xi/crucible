<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MASA — Bio-Lab Notebook</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>

/* ═══════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════ */
:root {
  --sidebar-w: 240px;
  --rail-w: 300px;
  --topbar-h: 44px;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);

  /* type */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-serif: 'Instrument Serif', Georgia, serif;
}

[data-theme="dark"] {
  --bg:           #0E0D0C;
  --bg-2:         #151412;
  --bg-3:         #1C1A18;
  --bg-4:         #232120;
  --bg-hover:     rgba(255,255,255,0.04);
  --bg-active:    rgba(255,255,255,0.07);
  --border:       rgba(255,255,255,0.07);
  --border-2:     rgba(255,255,255,0.12);
  --text-1:       #F2EFE9;
  --text-2:       rgba(242,239,233,0.55);
  --text-3:       rgba(242,239,233,0.30);
  --accent:       #C8965A;
  --accent-dim:   rgba(200,150,90,0.12);
  --accent-border:rgba(200,150,90,0.25);
  --green:        #4E9E7A;
  --green-dim:    rgba(78,158,122,0.12);
  --red:          #C45C5C;
  --red-dim:      rgba(196,92,92,0.12);
  --card-bg:      #151412;
  --card-border:  rgba(255,255,255,0.07);
  --input-bg:     #1C1A18;
  --shadow:       0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25);
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.3);
}

[data-theme="light"] {
  --bg:           #FAFAF8;
  --bg-2:         #F4F2EE;
  --bg-3:         #EDEAE4;
  --bg-4:         #E5E2DB;
  --bg-hover:     rgba(0,0,0,0.03);
  --bg-active:    rgba(0,0,0,0.055);
  --border:       rgba(0,0,0,0.08);
  --border-2:     rgba(0,0,0,0.14);
  --text-1:       #1A1917;
  --text-2:       rgba(26,25,23,0.55);
  --text-3:       rgba(26,25,23,0.32);
  --accent:       #A0693A;
  --accent-dim:   rgba(160,105,58,0.10);
  --accent-border:rgba(160,105,58,0.22);
  --green:        #3A7D5E;
  --green-dim:    rgba(58,125,94,0.10);
  --red:          #9B3E3E;
  --red-dim:      rgba(155,62,62,0.10);
  --card-bg:      #FFFFFF;
  --card-border:  rgba(0,0,0,0.08);
  --input-bg:     #FFFFFF;
  --shadow:       0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.06);
}

/* ═══════════════════════════════════════════════════════════════
   RESET + BASE
═══════════════════════════════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%; overflow: hidden;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-1);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.5;
}

button { font-family: var(--font-sans); cursor: pointer; border: none; background: none; color: inherit; }
input, textarea { font-family: var(--font-sans); color: inherit; background: none; border: none; outline: none; resize: none; }
::placeholder { color: var(--text-3); }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 99px; }
* { transition: background-color 0.25s var(--ease), border-color 0.25s var(--ease), color 0.15s var(--ease); }

/* ═══════════════════════════════════════════════════════════════
   LAYOUT SHELL
═══════════════════════════════════════════════════════════════ */
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr var(--rail-w);
  grid-template-rows: 1fr;
  height: 100vh;
  overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  border-right: 1px solid var(--border);
  overflow: hidden;
}

/* ── Wordmark ── */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.wordmark-icon {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
}
.wordmark-icon svg { width: 16px; height: 16px; }
.wordmark-text {
  font-family: var(--font-mono);
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
}
.sidebar-header-actions {
  margin-left: auto;
  display: flex; gap: 2px;
}
.icon-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 5px;
  color: var(--text-3);
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover { background: var(--bg-hover); color: var(--text-2); }
.icon-btn svg { width: 14px; height: 14px; }

/* ── Nav Items ── */
.sidebar-nav {
  padding: 8px 8px 0;
  flex-shrink: 0;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px; font-weight: 400;
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  user-select: none;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-1); }
.nav-item.active {
  background: var(--bg-active);
  color: var(--text-1);
  font-weight: 500;
}
.nav-item svg { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.7; }
.nav-item.active svg { opacity: 1; }
.nav-item .chevron { margin-left: auto; opacity: 0.4; font-size: 10px; transition: transform 0.2s var(--ease); }

/* ── Section Labels ── */
.sidebar-section-label {
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-3);
  padding: 18px 18px 6px;
}

/* ── History Items ── */
.history-list { overflow-y: auto; flex: 1; padding: 0 8px; }
.history-item {
  display: block;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 12.5px;
  color: var(--text-2);
  cursor: pointer;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: background 0.12s, color 0.12s;
}
.history-item:hover { background: var(--bg-hover); color: var(--text-1); }

/* ── New Buttons ── */
.sidebar-actions {
  padding: 10px 8px;
  display: flex; gap: 6px;
  flex-shrink: 0;
  border-top: 1px solid var(--border);
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 5px; padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 11.5px; font-weight: 500; color: var(--text-2);
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.action-btn:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-2); }
.action-btn svg { width: 12px; height: 12px; }

/* ── Bottom ── */
.sidebar-footer {
  padding: 6px 8px;
  flex-shrink: 0;
  display: flex; flex-direction: column; gap: 1px;
}
.footer-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12.5px; color: var(--text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.footer-item:hover { background: var(--bg-hover); color: var(--text-1); }
.footer-item svg { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.6; }
.user-row {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 10px 11px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
  cursor: pointer;
}
.user-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 9px; font-weight: 500;
  color: var(--accent); flex-shrink: 0;
}
.user-email { font-size: 12px; color: var(--text-2); }
.user-row .chevron { margin-left: auto; color: var(--text-3); font-size: 10px; }

/* ═══════════════════════════════════════════════════════════════
   MAIN VIEW
═══════════════════════════════════════════════════════════════ */
.main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
  position: relative;
}

/* ── Top Bar (main) ── */
.main-topbar {
  display: none; /* hidden in chat mode, shown in hybrid */
  align-items: center;
  gap: 0;
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  flex-shrink: 0;
  font-family: var(--font-mono);
}
.main-topbar.visible { display: flex; }
.topbar-tag {
  font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent); border: 1px solid var(--accent-border);
  background: var(--accent-dim); padding: 3px 9px; border-radius: 4px;
  margin-right: 16px;
}
.topbar-pipeline {
  font-size: 11px; color: var(--text-2);
  display: flex; align-items: center; gap: 8px;
}
.topbar-pipeline .step { color: var(--text-3); }
.topbar-pipeline .step.done { color: var(--text-2); }
.topbar-pipeline .arrow { color: var(--text-3); font-size: 10px; }
.topbar-phase {
  margin-left: auto;
  font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--accent); font-weight: 500;
}

/* ── Chat View ── */
.chat-view {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column;
  padding: 0;
}

/* Workbench Hero */
.workbench {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 64px 48px;
  gap: 48px;
}
.workbench-headline {
  text-align: center;
}
.workbench-headline h1 {
  font-family: var(--font-serif);
  font-size: 34px; font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--text-1);
  margin-bottom: 10px;
  line-height: 1.2;
}
.workbench-headline p {
  font-size: 14px; color: var(--text-2);
  font-weight: 400; line-height: 1.6;
}

/* Protocol Cards */
.protocol-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  width: 100%; max-width: 780px;
}
.protocol-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 28px 24px;
  cursor: pointer;
  transition: background 0.2s var(--ease), border-color 0.2s var(--ease), transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
  position: relative;
  overflow: hidden;
}
.protocol-card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.2s;
}
.protocol-card:hover {
  border-color: var(--border-2);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
.protocol-card:hover::after { opacity: 1; }
.protocol-card:active { transform: translateY(0); }
.protocol-card.selected {
  border-color: var(--accent-border);
  background: var(--accent-dim);
}
.card-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  color: var(--text-2);
}
[data-theme="dark"] .protocol-card:hover .card-icon { background: var(--bg-4); }
.card-icon svg { width: 16px; height: 16px; }
.protocol-card h3 {
  font-size: 13.5px; font-weight: 600;
  color: var(--text-1); margin-bottom: 8px;
  letter-spacing: -0.01em;
}
.protocol-card p {
  font-size: 12.5px; color: var(--text-2);
  line-height: 1.6;
}

/* ── Hybrid View ── */
.hybrid-view {
  flex: 1; overflow: hidden;
  display: none;
  grid-template-columns: 280px 1fr;
  gap: 0;
}
.hybrid-view.visible { display: grid; }

.hybrid-left {
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow-y: auto;
  padding: 24px;
  gap: 28px;
}
.hybrid-section-head {
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 12px;
}
.hybrid-sub {
  font-size: 11.5px; color: var(--text-3);
  margin-top: 2px;
}

.upload-zone {
  border: 1px dashed var(--border-2);
  border-radius: 8px; padding: 18px;
  text-align: center; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  color: var(--text-2); font-size: 12.5px;
}
.upload-zone:hover { background: var(--bg-hover); border-color: var(--accent-border); color: var(--text-1); }

.hybrid-input {
  border: 1px solid var(--border);
  border-radius: 7px; padding: 10px 12px;
  font-size: 12.5px; color: var(--text-1);
  background: var(--input-bg); width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hybrid-input:focus { border-color: var(--border-2); box-shadow: 0 0 0 3px var(--accent-dim); }

.start-btn {
  width: 100%; padding: 11px;
  background: var(--bg-3); border: 1px solid var(--border-2);
  border-radius: 8px; font-size: 13px; font-weight: 500;
  color: var(--text-1); cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  letter-spacing: -0.01em;
}
.start-btn:hover { background: var(--bg-4); border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-dim); }

.hybrid-canvas {
  display: flex; flex-direction: column;
  overflow: hidden;
}
.canvas-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 10px; padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.stat-card {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 8px; padding: 14px 16px;
}
.stat-label {
  font-family: var(--font-mono);
  font-size: 9px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-3); margin-bottom: 8px;
  line-height: 1.4;
}
.stat-value {
  font-family: var(--font-mono);
  font-size: 26px; font-weight: 400;
  color: var(--text-1); line-height: 1;
}
.stat-value.amber { color: var(--accent); }
.canvas-body {
  flex: 1; overflow-y: auto;
  display: flex; align-items: center; justify-content: center;
  padding: 48px;
}
.canvas-empty {
  text-align: center; max-width: 360px;
}
.canvas-empty h2 {
  font-family: var(--font-serif);
  font-size: 22px; font-weight: 400;
  color: var(--text-1); margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.canvas-empty p { font-size: 13px; color: var(--text-2); line-height: 1.6; }

/* ── Input Area ── */
.input-area {
  padding: 16px 20px 18px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg);
}
.input-box {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-box:focus-within {
  border-color: var(--border-2);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.input-box textarea {
  width: 100%; font-size: 13.5px;
  color: var(--text-1); line-height: 1.5;
  min-height: 44px; max-height: 160px;
  background: transparent;
}
.input-toolbar {
  display: flex; align-items: center;
  gap: 6px; margin-top: 12px;
}
.input-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 5px; font-size: 11.5px;
  color: var(--text-2); cursor: pointer;
  font-family: var(--font-mono);
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.input-chip:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-2); }
.input-chip svg { width: 11px; height: 11px; }
.input-chip .chevron { font-size: 9px; opacity: 0.5; }
.send-btn {
  margin-left: auto;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  background: var(--bg-3); border: 1px solid var(--border-2);
  border-radius: 6px; font-size: 12px; font-weight: 500;
  color: var(--text-1); cursor: pointer;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
}
.send-btn:hover { background: var(--bg-4); border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-dim); }
.send-btn svg { width: 12px; height: 12px; }
.enter-hint { font-size: 11px; color: var(--text-3); margin-right: 4px; font-family: var(--font-mono); }

/* ═══════════════════════════════════════════════════════════════
   EVIDENCE RAIL
═══════════════════════════════════════════════════════════════ */
.rail {
  background: var(--bg-2);
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.rail-header {
  display: flex; align-items: center;
  height: var(--topbar-h);
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 8px;
}
.rail-title {
  font-family: var(--font-mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-2);
}
.rail-sub { font-size: 11px; color: var(--text-3); }
.rail-indicator {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-3);
  flex-shrink: 0;
  animation: pulse 3s ease-in-out infinite;
}
.rail-indicator.live { background: var(--green); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.rail-body { flex: 1; overflow-y: auto; padding: 6px 0 16px; }

/* Rail Sections */
.rail-section {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.rail-section:last-child { border-bottom: none; }
.rail-section-head {
  display: flex; align-items: center; gap: 7px;
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-3); margin-bottom: 12px;
}
.rail-section-head svg { width: 11px; height: 11px; }
.rail-section-head .dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
}
.rail-section-head .dot.amber { background: var(--accent); }
.rail-section-head .dot.red { background: var(--red); }

/* Causal Density Rungs */
.rung-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.rung {
  border: 1px solid var(--border);
  border-radius: 7px; padding: 10px 10px 8px;
  background: var(--bg-3);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: center;
}
.rung:hover { background: var(--bg-4); border-color: var(--border-2); }
.rung.active { border-color: var(--accent-border); background: var(--accent-dim); }
.rung-level {
  font-family: var(--font-mono); font-size: 18px; font-weight: 400;
  color: var(--text-1); line-height: 1; margin-bottom: 5px;
}
.rung.active .rung-level { color: var(--accent); }
.rung-label { font-size: 10px; color: var(--text-3); }

.rung-status {
  font-size: 11.5px; color: var(--text-3);
  margin-top: 10px; line-height: 1.4;
}
.rung-status strong { color: var(--text-2); font-weight: 500; }

/* Rail Posture / Info Cards */
.rail-info-card {
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 7px; padding: 12px 14px;
  font-size: 12px; color: var(--text-2);
  line-height: 1.55;
}
.rail-info-card.green { border-color: rgba(78,158,122,0.2); background: var(--green-dim); }
.rail-info-card.amber { border-color: var(--accent-border); background: var(--accent-dim); }
.rail-info-card.red { border-color: rgba(196,92,92,0.2); background: var(--red-dim); }

.unavailable {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-3); line-height: 1.5;
}
.unavailable strong { color: var(--text-2); font-size: 11px; display: block; margin-bottom: 2px; }

/* Evidence Files */
.evidence-file {
  display: flex; align-items: flex-start;
  gap: 10px; padding: 10px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 4px;
}
.evidence-file:last-child { border-bottom: none; }
.evidence-file:hover { background: var(--bg-hover); }
.file-icon {
  width: 28px; height: 28px; border-radius: 5px;
  background: var(--bg-3); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--text-3);
}
.file-icon svg { width: 12px; height: 12px; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 12px; font-weight: 500; color: var(--text-1); truncate; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta {
  display: flex; align-items: center; gap: 8px;
  margin-top: 3px; font-family: var(--font-mono);
  font-size: 10px; color: var(--text-3);
}
.file-meta span { display: flex; align-items: center; gap: 3px; }

/* ═══════════════════════════════════════════════════════════════
   THEME TOGGLE + INTERACTIONS
═══════════════════════════════════════════════════════════════ */
.theme-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px; border-radius: 6px;
  font-size: 12.5px; color: var(--text-2);
  cursor: pointer; width: 100%;
  transition: background 0.12s, color 0.12s;
}
.theme-btn:hover { background: var(--bg-hover); color: var(--text-1); }
.theme-btn svg { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.6; }

/* ═══════════════════════════════════════════════════════════════
   MICRO-ANIMATIONS
═══════════════════════════════════════════════════════════════ */
.fade-in {
  animation: fadeIn 0.35s var(--ease) forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.stagger > * {
  opacity: 0;
  animation: fadeIn 0.4s var(--ease) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0.05s; }
.stagger > *:nth-child(2) { animation-delay: 0.12s; }
.stagger > *:nth-child(3) { animation-delay: 0.19s; }

/* ═══════════════════════════════════════════════════════════════
   VIEW SWITCHING
═══════════════════════════════════════════════════════════════ */
.view { display: none; flex: 1; flex-direction: column; overflow: hidden; }
.view.active { display: flex; }

</style>
</head>
<body>
<div class="shell">

  <!-- ══════════════════════════════ SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="wordmark-icon">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4h12M2 8h8M2 12h10" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="wordmark-text">Bio-Lab Notebook</span>
      <div class="sidebar-header-actions">
        <button class="icon-btn" title="Search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5" stroke-linecap="round"/></svg>
        </button>
        <button class="icon-btn" title="Toggle layout">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="12" rx="1"/><rect x="9" y="2" width="5" height="7" rx="1"/><rect x="9" y="11" width="5" height="3" rx="1"/></svg>
        </button>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-item active" onclick="switchView('chat')" id="nav-chat">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 2v-2H3a1 1 0 01-1-1V3z"/></svg>
        Chat
      </div>
      <div class="nav-item" onclick="switchView('hybrid')" id="nav-hybrid">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8a6 6 0 0112 0M5 11l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="5" r="1.5" fill="currentColor" stroke="none"/></svg>
        Hybrid
      </div>
      <div class="nav-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M5 6h6M5 9h4" stroke-linecap="round"/></svg>
        Relics
        <span class="chevron">▾</span>
      </div>
    </nav>

    <div class="sidebar-actions">
      <button class="action-btn">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2v8M2 6h8" stroke-linecap="round"/></svg>
        New chat
      </button>
      <button class="action-btn">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 9V4l4-2 4 2v5l-4 2-4-2z"/></svg>
        New folder
      </button>
    </div>

    <div class="sidebar-section-label">Folders</div>
    <div class="sidebar-section-label" style="padding-top: 10px;">History</div>

    <div class="history-list">
      <div class="history-item"># From Persia to the Modern M…</div>
      <div class="history-item">Why do you think your system …</div>
      <div class="history-item">Prompt (Nuanced, evidence-fir…</div>
      <div class="history-item">Prompt (Nuanced, evidence-fir…</div>
      <div class="history-item">Prompt (Nuanced, evidence-fir…</div>
      <div class="history-item">Do a web search on what is Op…</div>
      <div class="history-item">Do you have Causal architecture?</div>
      <div class="history-item">What would happen if AGI wer…</div>
    </div>

    <div class="sidebar-footer">
      <button class="theme-btn" onclick="toggleTheme()">
        <svg id="theme-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke-linecap="round"/></svg>
        <span id="theme-label">Light mode</span>
      </button>
      <div class="footer-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M6 6h4M6 9h2" stroke-linecap="round"/></svg>
        Documentation
      </div>
      <div class="footer-item">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5" stroke-linecap="round"/></svg>
        Model Settings
      </div>
    </div>

    <div class="user-row">
      <div class="user-avatar">CO</div>
      <span class="user-email">codewithafar@gmail.com</span>
      <span class="chevron">▾</span>
    </div>
  </aside>

  <!-- ══════════════════════════════ MAIN -->
  <main class="main">

    <!-- Chat View -->
    <div class="view active" id="view-chat">
      <div class="chat-view">
        <div class="workbench fade-in">
          <div class="workbench-headline">
            <h1>Scientific Workbench</h1>
            <p>Select a research protocol to begin your inquiry.</p>
          </div>
          <div class="protocol-grid stagger">
            <div class="protocol-card" onclick="selectCard(this)">
              <div class="card-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M3 3l2.5 2.5M10.5 10.5L13 13M3 13l2.5-2.5M10.5 5.5L13 3" stroke-linecap="round"/></svg>
              </div>
              <h3>Causal Discovery</h3>
              <p>Ingest observational data or papers to extract Structural Causal Models (SCM).</p>
            </div>
            <div class="protocol-card" onclick="selectCard(this)">
              <div class="card-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <h3>Intervention Planning</h3>
              <p>Simulate do-calculus interventions (do(X)=y) to predict system behavior.</p>
            </div>
            <div class="protocol-card" onclick="selectCard(this)">
              <div class="card-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v12M2 8h12" stroke-linecap="round"/><circle cx="8" cy="8" r="3" stroke-dasharray="2 1.5"/></svg>
              </div>
              <h3>Counterfactual Audit</h3>
              <p>Verify specific claims against the causal graph logic and evidence.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="input-area">
        <div class="input-box">
          <textarea rows="2" placeholder="Describe the real-world situation, what changed, and what outcome you need..."></textarea>
          <div class="input-toolbar">
            <button class="input-chip">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 1v10M1 6h10" stroke-linecap="round"/></svg>
              Attach
            </button>
            <button class="input-chip">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="4"/><path d="M6 4v2l1.5 1" stroke-linecap="round"/></svg>
              DiagnoseActValidate
            </button>
            <button class="input-chip">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6a4 4 0 108 0" stroke-linecap="round"/></svg>
              Scenarios
              <span class="chevron">▾</span>
            </button>
            <button class="input-chip">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 6h10M6 1v10" stroke-linecap="round"/></svg>
            </button>
            <button class="input-chip">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/></svg>
            </button>
            <span class="enter-hint">Enter to send</span>
            <button class="send-btn">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 10L10 6 2 2v3.5l5 .5-5 .5V10z" fill="currentColor" stroke="none"/></svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hybrid View -->
    <div class="view" id="view-hybrid">
      <div class="main-topbar visible">
        <span class="topbar-tag">Hybrid Discovery Engine</span>
        <div class="topbar-pipeline">
          <span class="step done">Ingest</span>
          <span class="arrow">→</span>
          <span class="step done">contradict</span>
          <span class="arrow">→</span>
          <span class="step done">synthesize</span>
          <span class="arrow">→</span>
          <span class="step">prove novelty</span>
        </div>
        <span class="topbar-phase">Phase: Deterministic Synthesis Routing</span>
      </div>

      <div class="hybrid-view visible" style="flex:1;overflow:hidden;">
        <div class="hybrid-left">
          <div>
            <div class="hybrid-section-head">Input Rail</div>
            <div class="hybrid-sub" style="margin-bottom:16px;">Source inventory, focus constraints, and execution</div>

            <div class="hybrid-section-head" style="margin-top:4px;">Research Sources</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
              <div class="upload-zone">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 6px;display:block;"><path d="M7 2v8M4 5l3-3 3 3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11h10" stroke-linecap="round"/></svg>
                Add PDF Files
              </div>
              <div style="padding:10px 12px;background:var(--bg-3);border:1px solid var(--border);border-radius:7px;font-size:12px;color:var(--text-3);text-align:center;">
                No PDFs selected
              </div>
            </div>

            <div class="hybrid-section-head">Companies</div>
            <div style="display:flex;gap:6px;margin-bottom:8px;">
              <input class="hybrid-input" placeholder="Add company name" style="flex:1;">
              <button style="width:34px;height:34px;border:1px solid var(--border);border-radius:7px;background:var(--bg-3);color:var(--text-2);font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background .12s,border-color .12s;" onmouseover="this.style.background='var(--bg-4)'" onmouseout="this.style.background='var(--bg-3)'">+</button>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-bottom:16px;">No companies added.</div>

            <div class="hybrid-section-head">Research Focus</div>
            <textarea class="hybrid-input" rows="4" placeholder="Optional: target a specific mechanism, sector, or causal tension" style="margin-bottom:16px;resize:vertical;"></textarea>

            <button class="start-btn">Start synthesis run</button>
          </div>
        </div>

        <div class="hybrid-canvas">
          <div class="canvas-stats">
            <div class="stat-card">
              <div class="stat-label">Sources</div>
              <div class="stat-value">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Validated Contradictions</div>
              <div class="stat-value">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Novelty Pass</div>
              <div class="stat-value">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Blocked Candidates</div>
              <div class="stat-value amber">0</div>
            </div>
          </div>
          <div class="canvas-body">
            <div class="canvas-empty fade-in">
              <h2>Dialectical Synthesis Canvas</h2>
              <p>Upload sources and run synthesis to render contradiction matrix, novelty proof, and falsification protocol.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </main>

  <!-- ══════════════════════════════ EVIDENCE RAIL -->
  <aside class="rail">
    <div class="rail-header">
      <div class="rail-indicator live"></div>
      <div>
        <div class="rail-title">Evidence Rail</div>
        <div class="rail-sub">Live causal posture and provenance</div>
      </div>
    </div>

    <div class="rail-body">

      <!-- Causal Density -->
      <div class="rail-section">
        <div class="rail-section-head">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10L6 2l4 8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 7h5" stroke-linecap="round"/></svg>
          Causal Density
        </div>
        <div class="rung-grid">
          <div class="rung">
            <div class="rung-level">L1</div>
            <div class="rung-label">Association</div>
          </div>
          <div class="rung">
            <div class="rung-level">L2</div>
            <div class="rung-label">Intervention</div>
          </div>
          <div class="rung">
            <div class="rung-level">L3</div>
            <div class="rung-label">Counterfactual</div>
          </div>
        </div>
        <div class="rung-status">Active rung: <strong>unavailable</strong><br>Awaiting scored output</div>
      </div>

      <!-- Alignment Posture -->
      <div class="rail-section">
        <div class="rail-section-head">
          <div class="dot"></div>
          Alignment Posture
        </div>
        <div class="rail-info-card green">
          No unaudited intervention claims without identifiability gates.
        </div>
      </div>

      <!-- Model Provenance -->
      <div class="rail-section">
        <div class="rail-section-head">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="4"/><path d="M6 4v2l1.5 1" stroke-linecap="round"/></svg>
          Model Provenance
        </div>
        <div class="unavailable">
          <strong>unavailable</strong>
          No verified model provenance was emitted for this run.
        </div>
      </div>

      <!-- Active Domain -->
      <div class="rail-section">
        <div class="rail-section-head">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="8" height="8" rx="1"/><path d="M5 5h2M5 7h1" stroke-linecap="round"/></svg>
          Active Domain
        </div>
        <div class="unavailable">unavailable</div>
      </div>

      <!-- Scientific Evidence -->
      <div class="rail-section">
        <div class="rail-section-head">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h6a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M4 5h4M4 7h2" stroke-linecap="round"/></svg>
          Scientific Evidence
        </div>
        <div>
          <div class="evidence-file">
            <div class="file-icon">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h4l3 3v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M7 2v3h3"/></svg>
            </div>
            <div class="file-info">
              <div class="file-name">AI-Alignment-Failure.pdf</div>
              <div class="file-meta">
                <span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="7" height="7" rx="1"/></svg>
                  54
                </span>
                <span>14 days ago</span>
              </div>
            </div>
          </div>
          <div class="evidence-file">
            <div class="file-icon">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h4l3 3v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M7 2v3h3"/></svg>
            </div>
            <div class="file-info">
              <div class="file-name">Disagreement-AI-Alignment.pdf</div>
              <div class="file-meta">
                <span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="7" height="7" rx="1"/></svg>
                  58
                </span>
                <span>21 days ago</span>
              </div>
            </div>
          </div>
          <div class="evidence-file">
            <div class="file-icon">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h4l3 3v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M7 2v3h3"/></svg>
            </div>
            <div class="file-info">
              <div class="file-name">Anomaly-Detection.pdf</div>
              <div class="file-meta">
                <span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="7" height="7" rx="1"/></svg>
                  151
                </span>
                <span>22 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </aside>

</div>

<script>
// ── Theme toggle ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-label').textContent = isDark ? 'Dark mode' : 'Light mode';
  const icon = document.getElementById('theme-icon');
  if (isDark) {
    icon.innerHTML = '<path d="M8 2a6 6 0 100 12A6 6 0 008 2z" fill="currentColor" stroke="none" opacity="0.3"/><path d="M10 8a2 2 0 11-4 0 2 2 0 014 0z" fill="currentColor" stroke="none"/>';
  } else {
    icon.innerHTML = '<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke-linecap="round"/>';
  }
}

// ── View switch ──
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.getElementById('nav-' + view).classList.add('active');
}

// ── Card select ──
function selectCard(el) {
  document.querySelectorAll('.protocol-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ── Subtle textarea auto-resize ──
document.querySelectorAll('textarea').forEach(ta => {
  ta.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 160) + 'px';
  });
});

// ── Rung selection ──
document.querySelectorAll('.rung').forEach(r => {
  r.addEventListener('click', function() {
    document.querySelectorAll('.rung').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
  });
});
</script>
</body>
</html>