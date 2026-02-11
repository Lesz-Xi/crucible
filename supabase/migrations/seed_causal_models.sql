-- Seed Data for Causal Models
-- Inserts the initial "Obsidian" models for MASA Core Domains.

INSERT INTO causal_models (domain, name, version, nodes, edges)
VALUES
-- 1. Forest Ecology (Wohlleben Network)
(
  'forest_ecology', 
  'Forest Resilience Network', 
  '2.1',
  '[
    {"id": "S", "name": "Node Stability", "type": "outcome", "domain": "ecology"},
    {"id": "v", "name": "Growth Velocity", "type": "observable", "domain": "ecology"},
    {"id": "D", "name": "Stand Density", "type": "observable", "domain": "ecology"},
    {"id": "K_net", "name": "Network Coupling", "type": "mechanism", "domain": "ecology"},
    {"id": "Eq", "name": "Equalization", "type": "mechanism", "domain": "ecology"},
    {"id": "H_int", "name": "Human Intervention", "type": "exogenous", "domain": "anthropogenic"},
    {"id": "E_dist", "name": "External Disturbance", "type": "exogenous", "domain": "environment"},
    {"id": "B_pump", "name": "Biotic Pump", "type": "mechanism", "domain": "climate"},
    {"id": "dT", "name": "Temperature Delta", "type": "observable", "domain": "climate"}
  ]'::jsonb,
  '[
    {"from": "v", "to": "D", "type": "positive_feedback"},
    {"from": "D", "to": "S", "type": "structural_support"},
    {"from": "S", "to": "v", "type": "resilience_boost"},
    {"from": "K_net", "to": "Eq", "type": "resource_flow"},
    {"from": "Eq", "to": "S", "type": "stabilization"},
    {"from": "H_int", "to": "K_net", "type": "fragmentation", "polarity": "negative"},
    {"from": "E_dist", "to": "S", "type": "damage", "polarity": "negative"},
    {"from": "B_pump", "to": "dT", "type": "cooling", "polarity": "negative"},
    {"from": "dT", "to": "S", "type": "thermal_stress", "polarity": "negative"}
  ]'::jsonb
),

-- 2. Selfish Gene (Dawkins)
(
  'evolutionary_biology', 
  'Selfish Gene Selection', 
  '1.5',
  '[
    {"id": "G", "name": "Gene", "type": "exogenous", "domain": "genetics"},
    {"id": "P", "name": "Protein", "type": "mechanism", "domain": "biology"},
    {"id": "T", "name": "Trait", "type": "observable", "domain": "biology"},
    {"id": "Fit", "name": "Fitness", "type": "outcome", "domain": "evolution"},
    {"id": "Alt", "name": "Altruism", "type": "decision", "domain": "behavior"},
    {"id": "r", "name": "Relatedness", "type": "context", "domain": "genetics"},
    {"id": "Benefit", "name": "Reproductive Benefit", "type": "observable", "domain": "evolution"},
    {"id": "Cost", "name": "Reproductive Cost", "type": "observable", "domain": "evolution"}
  ]'::jsonb,
  '[
    {"from": "G", "to": "P", "type": "expression"},
    {"from": "P", "to": "T", "type": "development"},
    {"from": "T", "to": "Fit", "type": "selection"},
    {"from": "r", "to": "Alt", "type": "kin_selection_threshold"},
    {"from": "Benefit", "to": "Alt", "type": "incentive"},
    {"from": "Cost", "to": "Alt", "type": "disincentive", "polarity": "negative"},
    {"from": "Alt", "to": "Fit", "type": "inclusive_fitness"}
  ]'::jsonb
),

-- 3. Cognitive Psychology (Kahneman)
(
  'cognitive_psychology', 
  'Thinking Fast and Slow', 
  '1.0',
  '[
    {"id": "Ref", "name": "Reference Point", "type": "context", "domain": "psychology"},
    {"id": "Delta", "name": "Gain/Loss Frame", "type": "observable", "domain": "psychology"},
    {"id": "Util", "name": "Utility Value", "type": "outcome", "domain": "economics"},
    {"id": "Bias", "name": "Loss Aversion", "type": "mechanism", "domain": "psychology"},
    {"id": "S1", "name": "System 1", "type": "exogenous", "domain": "cognition"},
    {"id": "S2", "name": "System 2", "type": "exogenous", "domain": "cognition"}
  ]'::jsonb,
  '[
    {"from": "S2", "to": "Ref", "type": "framing_adjustment"},
    {"from": "Ref", "to": "Delta", "type": "comparison"},
    {"from": "S1", "to": "Bias", "type": "heuristic_activation"},
    {"from": "Bias", "to": "Util", "type": "value_weighting"},
    {"from": "Delta", "to": "Util", "type": "prospect_evaluation"}
  ]'::jsonb
),

-- 4. Scaling Laws (Geoffrey West)
(
  'scaling_laws', 
  'Universal Scaling', 
  '1.2',
  '[
    {"id": "N", "name": "System Size", "type": "observable", "domain": "physics"},
    {"id": "B", "name": "Metabolic Rate", "type": "outcome", "domain": "physics"},
    {"id": "Beta", "name": "Scaling Exponent", "type": "mechanism", "domain": "math"},
    {"id": "Reg", "name": "Regime Selector", "type": "context", "domain": "taxonomy"},
    {"id": "Sing", "name": "Singularity Risk", "type": "outcome", "domain": "dynamics"},
    {"id": "Innov", "name": "Innovation Reset", "type": "exogenous", "domain": "society"}
  ]'::jsonb,
  '[
    {"from": "Reg", "to": "Beta", "type": "regime_definition"},
    {"from": "N", "to": "B", "type": "power_law_scaling"},
    {"from": "Beta", "to": "B", "type": "exponent_control"},
    {"from": "Beta", "to": "Sing", "type": "superlinear_divergence"},
    {"from": "Innov", "to": "Sing", "type": "collapse_avoidance", "polarity": "negative"}
  ]'::jsonb
)

ON CONFLICT (domain) DO UPDATE 
SET nodes = EXCLUDED.nodes, edges = EXCLUDED.edges, updated_at = NOW();
