# Synthetic-Mind Developer Startup Guide (Wave 7-8)

Welcome to the Synthetic-Mind mission. This guide will get you up and running with both the Synthesis Engine (SE) and Mission Control (MC) in under 15 minutes.

## Repositories

1. **Synthesis Engine (`synthesis-engine/` and/or `crucible/`)**
   - The core backend, exposing the Automated Scientist API.
   - Runs on port 3000.
2. **Mission Control (`mission-control-standalone/`)**
   - The frontend interface for interacting with the SE and Governance features.
   - Runs on port 3001.

---

## 🚀 Quick Start

### 1. Terminal 1: Synthesis Engine
```bash
cd synthesis-engine
npm install
npm run dev
# Server starts at http://localhost:3000
```
*Verify it's working:*
```bash
curl http://localhost:3000/api/bridge/health
# Should return {"status":"ok","version":"0.1.0", ...}
```

### 2. Terminal 2: Mission Control
```bash
cd mission-control-standalone
npm install
# Set environment variables
echo "NEXT_PUBLIC_SYNTHESIS_ENGINE_URL=http://localhost:3000/api/bridge" > .env.local
npm run dev -- -p 3001
# Server starts at http://localhost:3001
```

### 3. Verify the Bridge
1. Open `http://localhost:3001` in your browser.
2. If the Synthesis Engine is off, you will see a red/amber banner indicating "Degraded Mode" or "Offline".
3. When both are running, the banner will disappear (Healthy status).

---

## Troubleshooting

- **`EPERM: operation not permitted` on `node_modules` (macOS)**: Delete `node_modules` and `.next` folder, and re-run `npm install`.
- **Bridge Offline Banner Persistent**: Ensure `NEXT_PUBLIC_SYNTHESIS_ENGINE_URL` is set correctly in `mission-control-standalone/.env.local`.

## Architecture Note
Types are shared via `@synthetic-mind/bridge-types`. Update `synthesis-engine/src/lib/bridge/schema/bridge-types.ts` when changing the API contract.
