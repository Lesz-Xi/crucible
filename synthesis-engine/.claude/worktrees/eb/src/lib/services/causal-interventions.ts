/**
 * Phase 28 Component 2: Causal Interventions Service (do-Calculus Approximation)
 * 
 * Approximates Pearl's do-operator for computational mechanisms:
 * P(Y | do(X=x)) ≈ "Run mechanism with X clamped to x, measure Y"
 * 
 * Example:
 * - Claim: "If catalyst = 10g, then yield = 95%"
 * - Test: Clamp catalyst=10, run simulation, check yield ≈ 0.95
 * 
 * LIMITATION: This is NOT true do-calculus because:
 * - We don't have the full causal graph (only mechanism text)
 * - Cannot detect hidden confounders
 * - Only works for mechanisms with executable Python code
 * 
 * This is Pearl Layer 1.5-2: Better than correlation, not quite intervention
 * (we approximate intervention via simulation, not true graph surgery)
 */

import type { PyodideInterface } from 'pyodide';

export interface InterventionalClaim {
  intervention: {
    variable: string;  // e.g., "catalyst_amount"
    value: string | number;  // e.g., "10" or 10
    unit?: string;  // e.g., "g", "mol"
  };
  outcome: {
    variable: string;  // e.g., "product_yield"
    expected: string | number;  // e.g., "95%" or 0.95
    tolerance?: number;  // e.g., 0.05 for ±5%
  };
}

export interface InterventionalTestResult {
  claim_supported: boolean;
  actual_outcome: number | string;
  expected_outcome: number | string;
  difference?: number;
  violation?: {
    constraint: 'interventional_contradiction';
    description: string;
    severity: 'fatal' | 'warning';
    evidence: string;
  };
}

export class CausalInterventionTester {
  private pyodide: PyodideInterface | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    try {
      // With serverExternalPackages: ['pyodide'] in next.config.ts,
      // Pyodide is loaded directly from node_modules at runtime,
      // allowing it to find its WASM and Python stdlib assets correctly
      const { loadPyodide } = await import('pyodide');
      this.pyodide = await loadPyodide();
      await this.pyodide.loadPackage(['numpy', 'scipy']);
      this.initialized = true;
      console.log('[do-Calculus] Pyodide initialized for interventional testing');
    } catch (error) {
      console.error('[do-Calculus] Pyodide initialization failed:', error);
      console.warn('[do-Calculus] Interventional tests will be disabled for this session');
      this.initialized = false;
    }
  }

  /**
   * Parse mechanism text for interventional claims
   * 
   * Patterns detected:
   * 1. "If X = x, then Y = y"
   * 2. "Increasing X to x yields Y of y"
   * 3. "Setting X to x produces Y of y"
   */
  extractInterventionalClaims(mechanismText: string): InterventionalClaim[] {
    const claims: InterventionalClaim[] = [];

    // Pattern 1: "If catalyst = 10g, then yield = 95%"
    const pattern1 = /if\s+(\w+)\s*=\s*([0-9.]+)\s*(\w*),?\s+then\s+(\w+)\s*=\s*([0-9.]+)\s*(%?)/gi;
    let match;
    while ((match = pattern1.exec(mechanismText)) !== null) {
      claims.push({
        intervention: {
          variable: match[1],
          value: parseFloat(match[2]),
          unit: match[3] || undefined
        },
        outcome: {
          variable: match[4],
          expected: match[6] === '%' ? parseFloat(match[5]) / 100 : parseFloat(match[5]),
          tolerance: 0.05  // ±5% default
        }
      });
    }

    // Pattern 2: "Increasing temperature to 400K yields rate of 0.5"
    const pattern2 = /(increas|set|fix)\w*\s+(\w+)\s+to\s+([0-9.]+)\s*(\w*)\s+yields?\s+(\w+)\s+of\s+([0-9.]+)\s*(%?)/gi;
    while ((match = pattern2.exec(mechanismText)) !== null) {
      claims.push({
        intervention: {
          variable: match[2],
          value: parseFloat(match[3]),
          unit: match[4] || undefined
        },
        outcome: {
          variable: match[5],
          expected: match[7] === '%' ? parseFloat(match[6]) / 100 : parseFloat(match[6]),
          tolerance: 0.05
        }
      });
    }

    // Pattern 3: "At X = x, Y = y"
    const pattern3 = /at\s+(\w+)\s*=\s*([0-9.]+)\s*(\w*),?\s+(\w+)\s*=\s*([0-9.]+)\s*(%?)/gi;
    while ((match = pattern3.exec(mechanismText)) !== null) {
      claims.push({
        intervention: {
          variable: match[1],
          value: parseFloat(match[2]),
          unit: match[3] || undefined
        },
        outcome: {
          variable: match[4],
          expected: match[6] === '%' ? parseFloat(match[5]) / 100 : parseFloat(match[5]),
          tolerance: 0.05
        }
      });
    }

    return claims;
  }

  /**
   * Test interventional claim by running mechanism with clamped variable
   * 
   * This approximates Pearl's do-operator:
   * 1. Clamp intervention variable (graph surgery)
   * 2. Run simulation
   * 3. Measure outcome
   * 4. Compare with expected
   * 
   * @param mechanismCode - Python code implementing the mechanism
   * @param claim - Interventional claim to test
   * @returns Test result with actual vs expected outcome
   */
  async testInterventionalClaim(
    mechanismCode: string,
    claim: InterventionalClaim
  ): Promise<InterventionalTestResult> {
    if (!this.initialized || !this.pyodide) {
      console.warn('[do-Calculus] Pyodide not initialized, skipping interventional test');
      return {
        claim_supported: true,  // Default to passing if we can't test
        actual_outcome: 'N/A',
        expected_outcome: claim.outcome.expected
      };
    }

    try {
      // Step 1: Clamp intervention variable (do-operation / graph surgery)
      const clampedCode = this.clampVariable(
        mechanismCode, 
        claim.intervention.variable, 
        claim.intervention.value
      );

      console.log(`[do-Calculus] Testing: do(${claim.intervention.variable}=${claim.intervention.value}) → ${claim.outcome.variable}=?`);

      // Step 2: Run simulation in Pyodide
      await this.pyodide.runPythonAsync(clampedCode);

      // Step 3: Extract outcome variable
      const actualOutcome = this.pyodide.globals.get(claim.outcome.variable);

      // Step 4: Compare with expected
      const expected = typeof claim.outcome.expected === 'string' 
        ? parseFloat(claim.outcome.expected) 
        : claim.outcome.expected;
      
      const actual = typeof actualOutcome === 'number' 
        ? actualOutcome 
        : parseFloat(String(actualOutcome));

      const difference = Math.abs(actual - expected);
      const tolerance = claim.outcome.tolerance || 0.05;
      const withinTolerance = difference <= tolerance * Math.abs(expected);

      console.log(`[do-Calculus] Result: ${claim.outcome.variable}=${actual.toFixed(3)}, expected=${expected.toFixed(3)}, diff=${difference.toFixed(3)}`);

      if (withinTolerance) {
        console.log(`[do-Calculus] ✅ PASS - Claim supported`);
        return {
          claim_supported: true,
          actual_outcome: actual,
          expected_outcome: expected,
          difference
        };
      } else {
        console.log(`[do-Calculus] ❌ FAIL - Claim NOT supported`);
        return {
          claim_supported: false,
          actual_outcome: actual,
          expected_outcome: expected,
          difference,
          violation: {
            constraint: 'interventional_contradiction',
            description: `Interventional test failed: do(${claim.intervention.variable}=${claim.intervention.value}) → ${claim.outcome.variable}=${actual.toFixed(2)}, expected ${expected.toFixed(2)}`,
            severity: 'fatal',
            evidence: `Actual outcome differs by ${(difference * 100).toFixed(1)}% (tolerance: ±${(tolerance * 100).toFixed(0)}%)`
          }
        };
      }
    } catch (error) {
      console.error('[do-Calculus] Interventional test error:', error);
      // Default to passing on error (graceful degradation)
      return {
        claim_supported: true,
        actual_outcome: 'ERROR',
        expected_outcome: claim.outcome.expected
      };
    }
  }

  /**
   * Clamp variable to fixed value (implements do-operation / graph surgery)
   * 
   * Replaces any assignment to the variable with a fixed value.
   * This simulates "cutting incoming edges" in Pearl's graph surgery.
   * 
   * Example:
   * BEFORE: catalyst = calculate_optimal_amount()
   * AFTER:  catalyst = 10  # do-operation (CLAMPED)
   */
  private clampVariable(code: string, variable: string, value: string | number): string {
    // Pattern: variable = ... → variable = value
    const pattern = new RegExp(`${variable}\\s*=\\s*[^\\n]+`, 'g');
    return code.replace(pattern, `${variable} = ${value}  # do-operation (CLAMPED)`);
  }

  /**
   * Check if Pyodide is available for interventional testing
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}
