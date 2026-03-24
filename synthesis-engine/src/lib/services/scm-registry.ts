import { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SCMModel,
  SCMModelVersion,
  SCMVariable,
  VariableAlignment,
  VariableAlignmentResult,
} from "@/types/scm";

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapModelRow(row: any): SCMModel {
  return {
    id: row.id,
    modelKey: row.model_key,
    domain: row.domain,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersionRow(row: any): SCMModelVersion {
  return {
    id: row.id,
    modelId: row.model_id,
    version: row.version,
    isCurrent: row.is_current,
    dagJson: row.dag_json ?? { nodes: [], edges: [] },
    structuralEquationsJson: row.structural_equations_json ?? [],
    assumptionsJson: row.assumptions_json ?? [],
    confoundersJson: row.confounders_json ?? [],
    constraintsJson: row.constraints_json ?? [],
    provenanceJson: row.provenance_json ?? {},
    validationJson: row.validation_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVariableRow(row: any): SCMVariable {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    unit: row.unit,
    description: row.description,
    datatype: row.datatype,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SCMRegistryService {
  constructor(private readonly supabase: SupabaseClient) {}

  static async fromServer(): Promise<SCMRegistryService> {
    const supabase = await createServerSupabaseClient();
    return new SCMRegistryService(supabase);
  }

  async listModels(options?: { publicOnly?: boolean }): Promise<SCMModel[]> {
    let query = this.supabase.from("scm_models").select("*");
    if (options?.publicOnly) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query
      .order("domain", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapModelRow);
  }

  async getCurrentModelByDomain(domain: string): Promise<{ model: SCMModel; version: SCMModelVersion } | null> {
    const { data: modelRows, error: modelError } = await this.supabase
      .from("scm_models")
      .select("*")
      .eq("domain", domain)
      .in("status", ["active", "draft"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (modelError) throw new Error(modelError.message);
    const modelRow = modelRows?.[0];
    if (!modelRow) return null;

    const { data: versionRow, error: versionError } = await this.supabase
      .from("scm_model_versions")
      .select("*")
      .eq("model_id", modelRow.id)
      .eq("is_current", true)
      .single();

    if (versionError) throw new Error(versionError.message);
    return {
      model: mapModelRow(modelRow),
      version: mapVersionRow(versionRow),
    };
  }

  async getModelVersion(
    modelKey: string,
    version?: string,
    options?: { publicOnly?: boolean }
  ): Promise<{ model: SCMModel; version: SCMModelVersion } | null> {
    let modelQuery = this.supabase
      .from("scm_models")
      .select("*")
      .eq("model_key", modelKey);

    if (options?.publicOnly) {
      modelQuery = modelQuery.eq("status", "active");
    }

    const { data: modelRows, error: modelError } = await modelQuery
      .order("updated_at", { ascending: false })
      .limit(1);

    if (modelError) {
      if (modelError.code === "PGRST116") return null;
      throw new Error(modelError.message);
    }

    const modelRow = modelRows?.[0];
    if (!modelRow) return null;

    let versionQuery = this.supabase
      .from("scm_model_versions")
      .select("*")
      .eq("model_id", modelRow.id);

    if (version) {
      versionQuery = versionQuery.eq("version", version);
    } else {
      versionQuery = versionQuery.eq("is_current", true);
    }

    const { data: versionRows, error: versionError } = await versionQuery
      .order("created_at", { ascending: false })
      .limit(1);

    if (versionError) throw new Error(versionError.message);
    if (!versionRows || versionRows.length === 0) return null;

    return {
      model: mapModelRow(modelRow),
      version: mapVersionRow(versionRows[0]),
    };
  }

  async getVariableOntology(): Promise<SCMVariable[]> {
    const { data, error } = await this.supabase
      .from("scm_variable_ontology")
      .select("*")
      .order("canonical_name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapVariableRow);
  }

  alignVariables(inputVars: string[], ontology: SCMVariable[]): VariableAlignmentResult {
    const directMap = new Map<string, SCMVariable>();
    const aliasMap = new Map<string, SCMVariable>();
    const normalizedMap = new Map<string, SCMVariable>();

    for (const variable of ontology) {
      directMap.set(variable.canonicalName, variable);
      normalizedMap.set(normalizeToken(variable.canonicalName), variable);
      for (const alias of variable.aliases ?? []) {
        aliasMap.set(alias, variable);
        normalizedMap.set(normalizeToken(alias), variable);
      }
    }

    const aligned: VariableAlignment[] = inputVars.map((input) => {
      const direct = directMap.get(input);
      if (direct) {
        return {
          input,
          canonical: direct.canonicalName,
          variableId: direct.id,
          confidence: 1,
          matchedBy: "canonical",
        };
      }

      const alias = aliasMap.get(input);
      if (alias) {
        return {
          input,
          canonical: alias.canonicalName,
          variableId: alias.id,
          confidence: 0.92,
          matchedBy: "alias",
        };
      }

      const normalized = normalizedMap.get(normalizeToken(input));
      if (normalized) {
        return {
          input,
          canonical: normalized.canonicalName,
          variableId: normalized.id,
          confidence: 0.75,
          matchedBy: "normalized",
        };
      }

      return {
        input,
        confidence: 0,
        matchedBy: "none",
      };
    });

    return {
      aligned,
      unknown: aligned.filter((item) => item.matchedBy === "none").map((item) => item.input),
    };
  }
}
