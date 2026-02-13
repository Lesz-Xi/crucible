# Higher-Order Causal Audit

Deterministic audit tooling for Rosenthal HOT SCM in `hot_causal_graph.json`.

## Quick Start

```bash
python3 Higher-Order/hot_audit.py \
  --spec Higher-Order/hot_causal_graph.json \
  --state-dataset Higher-Order/sample_hot_states.csv \
  --validate-tp \
  --validate-separability \
  --validate-assertoric \
  --validate-two-state \
  --simulate-granularity \
  --initial-concept-res 0.5 \
  --steps 10
```

## CLI Parameters

Required:
- `--spec`: HOT graph JSON path.

Dataset and constraint checks:
- `--state-dataset`: CSV for state-level validation.
- `--validate-tp`: Validate Transitivity Principle.
- `--validate-separability`: Validate `Q(s) ⟂ C(s)` via Pearson `r`.
- `--validate-assertoric`: Ensure only assertoric HOT yields consciousness.
- `--validate-two-state`: Ensure conscious states satisfy `h != s` (full check when `hot_state_id` column exists).
- `--separability-threshold`: Max allowed `|r|` for separability pass (default `0.1`).

Simulation:
- `--simulate-granularity`: Run `Res(E) ∝ Res(C_E)` trajectory.
- `--initial-concept-res`: Initial concept resolution (default `0.5`).
- `--granularity-alpha`: Proportionality constant (default `0.95`).
- `--concept-step`: Per-step increase in concept resolution (default `0.05`).
- `--max-resolution`: Max bound for trajectory (default `1.0`).
- `--steps`: Number of simulation steps (default `10`).
- `--transition-state-id`: Optional state for deterministic `do_make_state_conscious` simulation.

Output:
- `--out`: Write full JSON report to file.
- `--plot-granularity`: Save granularity plot (requires matplotlib).
- `--plot-out`: Plot path (default `Higher-Order/granularity_trajectory.png`).

## Dataset Schema

`sample_hot_states.csv` columns:
- `state_id`
- `has_hot` (`0|1`)
- `hot_attitude` (`Assert|Doubt|Wonder|None`)
- `is_conscious` (`0|1`)
- `qualia_intensity` (float)
- `concept_resolution` (float)
- `hot_state_id` (optional but recommended for full two-state check)
- `qualia_label` (optional helper label)

## Output Format

Script prints a deterministic text report with sections:
1. Graph structure validation (node/edge integrity, DAG check, core constraints).
2. TP validation summary and violating states.
3. Separability result (`r` and threshold pass/fail).
4. Constraint cross-checks (assertoric + two-state).
5. Intervention simulation (`do_make_state_conscious` pre/post).
6. Granularity trajectory (if requested).
7. Misrepresentation analysis (Dental Fear error case).
8. Recommendations.

To also persist machine-readable results:

```bash
python3 Higher-Order/hot_audit.py \
  --spec Higher-Order/hot_causal_graph.json \
  --state-dataset Higher-Order/sample_hot_states.csv \
  --validate-tp \
  --validate-separability \
  --out Higher-Order/hot_audit_report.json
```
