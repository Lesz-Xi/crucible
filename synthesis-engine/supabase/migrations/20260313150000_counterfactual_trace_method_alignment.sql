ALTER TABLE counterfactual_traces
  DROP CONSTRAINT IF EXISTS counterfactual_traces_computation_method_check;

ALTER TABLE counterfactual_traces
  ADD CONSTRAINT counterfactual_traces_computation_method_check
  CHECK (
    computation_method IN (
      'deterministic_graph_diff',
      'heuristic_bfs_propagation',
      'structural_equation_solver'
    )
  );

ALTER TABLE counterfactual_traces
  DROP CONSTRAINT IF EXISTS counterfactual_traces_uncertainty_check;

ALTER TABLE counterfactual_traces
  ADD CONSTRAINT counterfactual_traces_uncertainty_check
  CHECK (uncertainty IN ('none', 'high', 'medium', 'low'));
