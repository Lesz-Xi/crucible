import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { McpToolError } from "@/lib/mcp/errors";
import { SCMRegistryService } from "@/lib/services/scm-registry";

const GetActiveScmInputSchema = z.object({
  domain: z.string().min(1).max(100),
  model_key: z.string().max(200).optional(),
  include_equations: z.boolean().default(false),
});

const DagSchema = z.object({
  nodes: z.array(z.string()),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
    })
  ),
});

const GetActiveScmOutputSchema = z.object({
  found: z.boolean(),
  model: z
    .object({
      model_key: z.string(),
      domain: z.string(),
      name: z.string(),
      description: z.string(),
      status: z.enum(["active", "draft"]),
      version: z.string(),
      dag: DagSchema,
      structural_equations: z.array(z.record(z.string(), z.unknown())).optional(),
      assumptions: z.array(z.string()).optional(),
    })
    .optional(),
});

export type GetActiveScmInput = z.infer<typeof GetActiveScmInputSchema>;
export type GetActiveScmOutput = z.infer<typeof GetActiveScmOutputSchema>;

function normalizeNode(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }

  if (node && typeof node === "object") {
    const candidate = node as Record<string, unknown>;
    for (const key of ["id", "name", "label", "variable", "canonicalName"]) {
      const value = candidate[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
  }

  return JSON.stringify(node);
}

function normalizeEdge(edge: unknown): { from: string; to: string } {
  const candidate = (edge ?? {}) as Record<string, unknown>;
  const from = candidate.from ?? candidate.source ?? "";
  const to = candidate.to ?? candidate.target ?? "";

  return {
    from: typeof from === "string" ? from : JSON.stringify(from),
    to: typeof to === "string" ? to : JSON.stringify(to),
  };
}

function normalizeAssumptions(values: Array<Record<string, unknown> | string> | undefined): string[] {
  return (values ?? []).map((value) => (typeof value === "string" ? value : JSON.stringify(value)));
}

function sanitizeScmError(message: string): string {
  return /policy|permission|rls|not authorized/i.test(message) ? "Access denied by policy" : message;
}

export async function getActiveScm(
  input: GetActiveScmInput,
  supabase: SupabaseClient
): Promise<GetActiveScmOutput> {
  try {
    const registry = new SCMRegistryService(supabase);

    const result = input.model_key
      ? await registry.getModelVersion(input.model_key, undefined, { publicOnly: true })
      : await (async () => {
          const models = await registry.listModels({ publicOnly: true });
          const domainModel = models.find((model) => model.domain === input.domain);

          if (!domainModel) {
            return null;
          }

          return registry.getModelVersion(domainModel.modelKey, undefined, { publicOnly: true });
        })();

    if (!result) {
      return { found: false };
    }

    const { model, version } = result;

    const output: GetActiveScmOutput = {
      found: true,
      model: {
        model_key: model.modelKey,
        domain: model.domain,
        name: model.name,
        description: model.description ?? "",
        status: model.status === "active" ? "active" : "draft",
        version: version.version,
        dag: {
          nodes: (version.dagJson?.nodes ?? []).map(normalizeNode),
          edges: (version.dagJson?.edges ?? []).map(normalizeEdge),
        },
        assumptions: normalizeAssumptions(version.assumptionsJson),
      },
    };

    if (input.include_equations && output.model) {
      output.model.structural_equations = (version.structuralEquationsJson ?? []) as Array<Record<string, unknown>>;
    }

    return GetActiveScmOutputSchema.parse(output);
  } catch (error) {
    const message = error instanceof Error ? sanitizeScmError(error.message) : "Unknown error";
    throw new McpToolError("get_active_scm", message);
  }
}

export function registerGetActiveScm(server: McpServer, supabase: SupabaseClient): void {
  server.registerTool(
    "get_active_scm",
    {
      description: "Return the active public SCM for a domain or model key.",
      inputSchema: GetActiveScmInputSchema.shape,
      outputSchema: GetActiveScmOutputSchema.shape,
    },
    async (args) => {
      const structuredContent = await getActiveScm(args, supabase);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(structuredContent, null, 2),
          },
        ],
        structuredContent,
      };
    }
  );
}
