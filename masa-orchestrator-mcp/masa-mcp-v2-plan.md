# Comprehensive Plan: Upgrading MASA Orchestrator (v2.0)

## Rationale
Recent bug fixes across `crucible` (synthesis-engine) highlighted systemic gaps in our governance model. While the current `masa-orchestrator-mcp` effectively validates LLM independence, core benchmark passing, and formal notation compliance, it completely overlooks **UI/UX integrity** and **frontend state lifecycle drift**. 

Issues such as off-screen drawers (Lab Copilot), missing scroll boundaries (Education feature), missing dark mode variants (Hypothesis Builder), and hanging async states (History fetch) reflect a need for **Automated Frontend Governance**.

## Phase 1: Expanded Static Analysis 

### 1. `check_frontend_compliance` (New MCP Tool)
We will introduce an AST/Regex-powered scanner to evaluate React components for structural UI robustness.
*   **Responsive Integrity:** Flags absolute bounds (e.g., `w-[380px]`) that lack responsive guards (`max-w-full`, `lg:w-auto`).
*   **Dark Mode Parity:** Triggers warnings if a component applies explicit light-mode colors (e.g., `bg-white`, `border-gray-200`) without a corresponding `dark:` variant.
*   **Overlap Prevention:** Checks top-level overlays for appropriate `z-index` stacking context definitions to prevent hamburger menu and sidebar collisions.
*   **Aesthetic & Motion Enforcement (21st.dev/Awwwards):** Scans for required usage of Framer Motion (`<motion.div>`) on interactive elements, ensures proper True Black (`#000000`) and elevated (`#0A0A0A`) surface tokens are used instead of generic grays, and validates presence of `radial-gradient` or glassmorphic (`backdrop-blur`) utility classes on primary containers.

### 2. `verify_state_transitions` (New MCP Tool)
State-hanging (like the "pending protein fetch" issue) damages scientific provenance. 
*   **Lifecycle Auditing:** Scans context providers and action handlers to ensure all `createExperiment` or `startTransition` calls have guaranteed `.catch()` or `finally()` closures that dispatch `success`/`error` events.
*   **Anti-Hanging Guards:** Evaluates component trees for `isLoading` bounds that don't have timeouts or fallback UI.

## Phase 2: Headless DOM Verification (The Pipeline)

### 3. `audit_dom_layout` (New MCP Tool Integrations)
Extend the orchestrator to communicate directly with Playwright/Vitest-Browser to run DOM validations during the `VERIFYING` phase.
*   **Assertion:** Validates that no rendering elements are situated outside the `100vw`/`100vh` bounding box unless explicitly marked as `<dialog>` or off-screen drawers.
*   **Interaction Tests:** Triggers basic interactive surface checks automatically during the `task_boundary` verification step to catch edge clipping.

## Phase 3: Project Architecture Updates for `masa-orchestrator-mcp`
1.  **Refactoring the AST Parser:** Update the underlying `src/utils/ast-parser.ts` inside the MASA repo to support `.tsx` JSX element attributes.
2.  **Schema Expansion:** Include `frontend-compliance` in the `governance.json` schema to track UI milestone metrics centrally.
3.  **Governance Sentinel (`governance:trace-integrity`):** Expand the GitHub actions sentinel to include `governance:ui-integrity` preventing PRs with non-responsive layouts from merging.
