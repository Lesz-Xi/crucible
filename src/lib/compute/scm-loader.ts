import type { SupabaseClient } from "@supabase/supabase-js";
import type { StructuralEquation, TypedSCM } from "@/types/scm";
import { SCMRegistryService } from "@/lib/services/scm-registry";

/**
 * Load a TypedSCM for the given modelKey from the active scm_model_versions row.
 *
 * Returns undefined (never throws) when:
 * - modelKey is falsy
 * - no active row found in scm_model_versions
 * - the row has no valid typed equations array (legacy blob format)
 * - any DB or parse error occurs
 *
 * When a valid TypedSCM is returned, callers should pass it as the third
 * argument to buildCounterfactualTrace() to activate the structural equation
 * solver path (computation_method: 'structural_equation_solver').
 */
export async function loadTypedSCM(
  modelKey: string,
  supabase: SupabaseClient
): Promise<TypedSCM | undefined> {
  try {
    if (!modelKey) return undefined;

    const registry = new SCMRegistryService(supabase);
    const modelData = await registry.getModelVersion(modelKey);
    if (!modelData) return undefined;

    const { version } = modelData;

    // Validate: must have an equations array (not the legacy blob)
    const equations = version.structuralEquationsJson;
    if (!Array.isArray(equations) || equations.length === 0) {
      return undefined;
    }

    // Duck typing to differentiate between legacy blob and new StructuralEquation[]
    const firstEq = equations[0] as Record<string, unknown>;
    if (!firstEq || typeof firstEq !== 'object' || !('variable' in firstEq) || !('coefficients' in firstEq)) {
      return undefined; // Still using legacy JSON format
    }

    // SCM demands full variable metadata; we fetch the global ontology
    const ontology = await registry.getVariableOntology().catch(() => []);

    return {
      variables: ontology,
      equations: equations as unknown as StructuralEquation[],
      dag: version.dagJson as any,
    } as TypedSCM;
  } catch (error) {
    console.warn(`[loadTypedSCM] Failed to load TypedSCM for ${modelKey}:`, error);
    return undefined;
  }
}

