# MASA Architecture Reference

---

## What MASA Is

**MASA** (Methods of Automated Scientific Analysis) is an **Automated Scientist** platform — not
a chat wrapper. Its goal: move from probabilistic text generation toward causal, falsifiable
scientific reasoning.

- **From** correlation → **To** causal mechanism modeling
- **From** "looks plausible" → **To** "can be tested and falsified"
- **From** one-off chat → **To** persistent, governed epistemic workflows

Primary white paper: `Synthetic-Mind/MASA_White_Paper.html`
Architecture summary: `Synthetic-Mind/MASA-Theoretical-Foundation/MASA_ARCHITECTURE_CURRENT_STATE_SUMMARY_2026-02-12.md`

---

## Product Stack

| App | Repo folder | Deployment | Notes |
|---|---|---|---|
| synthesis-engine | `Synthetic-Mind/synthesis-engine` | wuweism.com (Vercel) | Next.js 15, Tailwind |
| Design system | `Synthetic-Mind/design-system` | — | tokens.json, MASA_Prototype.html |
| Figma | "MASA Design System" file | — | Tokens Studio plugin |

---

## synthesis-engine App Structure

```
synthesis-engine/
├── src/
│   ├── app/
│   │   ├── globals.css          # @import './generated-tokens.css' on line 1
│   │   ├── generated-tokens.css # AUTO-GENERATED — do not hand-edit
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page
│   │   └── api/
│   │       ├── causal-chat/
│   │       ├── hybrid-synthesize/
│   │       ├── synthesis-history/
│   │       └── legal-reasoning/
│   └── components/
│       ├── landing/             # Hero, Header, Features, StatsBar, etc.
│       └── causal-chat/
│           ├── CausalChatInterface.tsx
│           ├── HistorySidebar.tsx
│           └── visuals/
│               ├── TruthStream.tsx
│               ├── CausalGauge.tsx
│               ├── OracleModeIndicator.tsx
│               ├── AxiomPanel.tsx
│               └── MechanismCloud.tsx
├── style-dictionary.config.js   # Token build script
├── tailwind.config.ts           # darkMode: "class"
└── package.json                 # prebuild + tokens:build scripts
```

---

## Three Research Interfaces

| Route | Name | Purpose |
|---|---|---|
| `/` | Landing | Public marketing page |
| `/chat` (causal-chat) | Causal Workbench | Causal dialogue, intervention framing |
| `/hybrid` | Hybrid Synthesis | Contradiction-driven synthesis, novelty proofing |
| `/legal` | Legal Causation | But-for / proximate causation analysis |

---

## MASA Architecture Layers

### Layer A: Interface / Workbench
- 2041-style workbench UI (the design system we've been building)
- Evidence rails + stage telemetry for transparency
- Session/history UX with authenticated persistence

### Layer B: Causal Application Logic
- Domain classification + constraint injection in chat paths
- Synthesis orchestration: contradiction, novelty, recovery
- Legal causation: but-for/proximate concepts

### Layer C: Governance & Scientific Integrity
- Claim drift sentinel + governance evaluators
- Novelty proof sentinel pipeline
- Policy/method/calibration/law-falsification specs

### Layer D: Truth Store / Persistence
- Supabase for history, run artifacts
- Migration-led schema evolution
- Session/import/adoption workflows

---

## Style Dictionary Pipeline

Token source: `design-system/tokens.json`
Config: `synthesis-engine/style-dictionary.config.js`
Output: `synthesis-engine/src/app/generated-tokens.css`

### CSS Output Selectors
```
:root                  ← core tokens (font, spacing, radius, sizing)
:root, .light          ← light theme colors
.dark                  ← dark theme colors
```

The `.dark` class is placed on `<html>` by Tailwind's `darkMode: "class"` — NOT `[data-theme]`.
The prototype HTML uses `[data-theme="dark"]` — that's only for the standalone file.

### To Rebuild
```bash
cd synthesis-engine
npm run tokens:build         # manual rebuild
npm run prebuild             # also runs before every next build
```

The config has `TOKEN_SOURCE_CANDIDATES` fallback paths for robustness on Vercel:
```js
const TOKEN_SOURCE_CANDIDATES = [
  process.env.TOKENS_JSON_PATH,
  path.resolve(ROOT_DIR, '../design-system/tokens.json'),
  path.resolve(ROOT_DIR, 'design-system/tokens.json'),
].filter(Boolean);
```

---

## Causal Gauge / Confidence System

CausalGauge has three levels (from TruthStream.tsx / CausalGauge.tsx):
- **L1 (Blue)**: Correlational — statistical association only
- **L2 (Purple/Amber)**: Interventional — do-calculus level
- **L3 (Amber/Gold)**: Counterfactual — pearl level 3

Status color mapping:
```
High confidence  → --green  (#4E9E7A dark / #3A7D5E light)
Medium/amber     → --accent (#C8965A dark / #A0693A light)
Low / uncertain  → --red    (#C45C5C dark / #9B3E3E light)
```

---

## Component Naming Vocabulary

Prefer **lab / science** vocabulary:

| Use | Avoid |
|---|---|
| Protocol | Preset, Template |
| Evidence | Data, Input |
| Confidence | Score, Level |
| Axiom | Rule, Fact |
| Mechanism | Process, Method |
| Calibration | Settings, Config |
| Telemetry | Metrics, Stats |
| Synthesis | Analysis, Summary |
| Workbench | Dashboard, Home |
| Oracle Mode | Expert Mode |

---

## Known Git Branch

The most recent design-system work is on:
```
branch: codex/style-dictionary-token-sync-20260309
```

Push from Mac terminal (VM has no outbound internet):
```bash
git push origin codex/style-dictionary-token-sync-20260309
```

---

## Figma

File: **MASA Design System**
Plugin: Tokens Studio for Figma (v2.11.1)

Three token sets loaded: `core`, `dark`, `light`
To paste JSON into Tokens Studio:
1. Click on `{}` in the JSON editor at ~(771, 246) in the plugin panel
2. Press `cmd+a` then `cmd+v` (Mac shortcuts — ctrl doesn't work; Figma intercepts ctrl as canvas commands)