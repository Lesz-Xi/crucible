/**
 * Phase 28.5: Forest Ecology Schema Loader
 * 
 * Parses the user's Tree-of-Life formalization of Wohlleben's
 * "The Hidden Life of Trees" into a Pearl-compatible Structural Causal Model.
 * 
 * The schema contains:
 * - Network topology (nodes = trees, edges = mycorrhizal connections)
 * - Functional equations (dS/dt = F(S) - γLS)
 * - Empirical validation (case studies: healthy vs fragmented forests)
 * - Interventional data (sensitivity analysis: do(K_ij = 0))
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ===== TypeScript Interfaces for Forest Network Schema =====

export interface ForestNetworkNode {
  id: string;
  stability: number;  // S_i
  degree: number;     // d_i = Σ K_ij
}

export interface ForestNetworkEdge {
  from: string;
  to: string;
  strength: number;  // K_ij (mycorrhizal connection weight)
}

export interface ForestCaseStudy {
  scenario: string;
  topology: 'watts_strogatz' | 'random';
  gamma: number;  // Network coupling strength
  k?: number;     // Watts-Strogatz parameter (average degree)
  p?: number;     // Rewiring probability
  metrics: {
    scenario: string;
    pre_stress_stability: number;
    min_stability: number;
    stability_drop: number;
    recovery_rate: number;
    final_stability: number;
    final_variance: number;
    time_to_min: number;
  };
}

export interface HypothesisValidation {
  hypothesis: string;
  criteria: {
    healthy_higher_final_stability: boolean;
    healthy_smaller_stability_drop: boolean;
  };
  healthy_final_stability: number;
  fragmented_final_stability: number;
  stability_difference: number;
  healthy_stability_drop: number;
  fragmented_stability_drop: number;
  drop_ratio: number;  // How much worse is fragmentation?
  hypothesis_supported: boolean;
}

export interface ForestSchema {
  network: {
    nodes: ForestNetworkNode[];
    edges: ForestNetworkEdge[];
    coupling_strength: number;  // γ parameter
  };
  empirical_validation: {
    healthy_forest: ForestCaseStudy;
    fragmented_forest: ForestCaseStudy;
    hypothesis_validation: HypothesisValidation;
  };
  functional_equations: {
    node_dynamics: string;  // dS/dt = F(S) - γLS
    graph_laplacian: string;  // L = D - K_net
    equalization_factor: string;  // Eq = -γLS
  };
}

/**
 * Load and parse the Tree-of-Life forest network schema
 * 
 * @param schemaPath - Absolute path to the schema directory
 * @returns Parsed forest schema with network topology and empirical data
 */
export async function loadForestSchema(schemaPath: string): Promise<ForestSchema> {
  try {
    // Parse case studies JSON (contains empirical validation data)
    const caseStudiesPath = path.join(schemaPath, 'case_studies_summary.json');
    const caseStudiesRaw = await fs.readFile(caseStudiesPath, 'utf-8');
    const caseStudies = JSON.parse(caseStudiesRaw);

    console.log('[Schema Loader] Loaded case studies from:', caseStudiesPath);

    // Extract healthy and fragmented forest data
    const healthyForest: ForestCaseStudy = {
      scenario: caseStudies.healthy_forest.metrics.scenario,
      topology: caseStudies.healthy_forest.topology,
      gamma: caseStudies.healthy_forest.gamma,
      k: caseStudies.healthy_forest.k,
      p: caseStudies.healthy_forest.p,
      metrics: caseStudies.healthy_forest.metrics
    };

    const fragmentedForest: ForestCaseStudy = {
      scenario: caseStudies.fragmented_forest.metrics.scenario,
      topology: caseStudies.fragmented_forest.topology,
      gamma: caseStudies.fragmented_forest.gamma,
      p: caseStudies.fragmented_forest.p,
      metrics: caseStudies.fragmented_forest.metrics
    };

    // Extract hypothesis validation results
    const hypothesisValidation: HypothesisValidation = {
      hypothesis: caseStudies.hypothesis_validation.street_kids_hypothesis,
      criteria: caseStudies.hypothesis_validation.criteria,
      healthy_final_stability: caseStudies.hypothesis_validation.healthy_final_stability,
      fragmented_final_stability: caseStudies.hypothesis_validation.fragmented_final_stability,
      stability_difference: caseStudies.hypothesis_validation.stability_difference,
      healthy_stability_drop: caseStudies.hypothesis_validation.healthy_stability_drop,
      fragmented_stability_drop: caseStudies.hypothesis_validation.fragmented_stability_drop,
      drop_ratio: caseStudies.hypothesis_validation.drop_ratio,
      hypothesis_supported: caseStudies.hypothesis_validation.hypothesis_supported
    };

    // Parse network dynamics Markdown (contains functional equations)
    const dynamicsPath = path.join(schemaPath, 'network_dynamics.md');
    await fs.readFile(dynamicsPath, 'utf-8');
    
    console.log('[Schema Loader] Loaded network dynamics from:', dynamicsPath);

    // Create schema object
    const schema: ForestSchema = {
      network: {
        nodes: [],  // Placeholder - would need simulation data to populate
        edges: [],  // Placeholder - would need adjacency matrix to populate
        coupling_strength: healthyForest.gamma  // Use healthy forest coupling as baseline
      },
      empirical_validation: {
        healthy_forest: healthyForest,
        fragmented_forest: fragmentedForest,
        hypothesis_validation: hypothesisValidation
      },
      functional_equations: {
        node_dynamics: 'dS/dt = F(S) - γLS',
        graph_laplacian: 'L = D - K_net',
        equalization_factor: 'Eq = -γLS'
      }
    };

    console.log('[Schema Loader] Forest schema loaded successfully');
    console.log('[Schema Loader] Empirical validation:');
    console.log(`  - Healthy forest stability drop: ${(healthyForest.metrics.stability_drop * 100).toFixed(2)}%`);
    console.log(`  - Fragmented forest stability drop: ${(fragmentedForest.metrics.stability_drop * 100).toFixed(2)}%`);
    console.log(`  - Fragmentation impact: ${hypothesisValidation.drop_ratio.toFixed(1)}x worse`);

    return schema;
  } catch (error) {
    console.error('[Schema Loader] Failed to load forest schema:', error);
    throw new Error(`Failed to load forest schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}
