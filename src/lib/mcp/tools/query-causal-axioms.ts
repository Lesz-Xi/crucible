import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { McpToolError } from "@/lib/mcp/errors";
import { MCP_DOMAINS } from "@/lib/mcp/types";

const QueryCausalAxiomsInputSchema = z.object({
  query: z.string().min(3).max(500),
  domain: z.enum(MCP_DOMAINS).optional(),
  confidence_threshold: z.number().min(0.5).max(1).default(0.7),
  limit: z.number().int().min(1).max(20).default(5),
});

const QueryCausalAxiomsOutputSchema = z.object({
  axioms: z.array(
    z.object({
      id: z.string().uuid(),
      axiom_content: z.string(),
      confidence_score: z.number().min(0).max(1),
      causal_level: z.literal(3),
      source: z.enum(["session_extracted", "agent_proposed", "human_verified"]),
      created_at: z.string(),
    })
  ),
  total_found: z.number().int().min(0),
  query_echo: z.string(),
});

export type QueryCausalAxiomsInput = z.infer<typeof QueryCausalAxiomsInputSchema>;
export type QueryCausalAxiomsOutput = z.infer<typeof QueryCausalAxiomsOutputSchema>;

function sanitizeDbError(message: string): string {
  return /policy|permission|rls|not authorized/i.test(message) ? "Access denied by policy" : message;
}

export async function queryCausalAxioms(
  input: QueryCausalAxiomsInput,
  supabase: SupabaseClient
): Promise<QueryCausalAxiomsOutput> {
  const threshold = input.confidence_threshold ?? 0.7;
  const limit = Math.min(input.limit ?? 5, 20);

  let query = supabase
    .from("causal_axioms")
    .select("id, axiom_content, confidence_score, source, created_at")
    .ilike("axiom_content", `%${input.query}%`)
    .gte("confidence_score", threshold)
    .order("confidence_score", { ascending: false })
    .limit(limit);

  if (input.domain) {
    query = query.eq("domain", input.domain);
  }

  const { data, error } = await query;
  if (error) {
    throw new McpToolError("query_causal_axioms", sanitizeDbError(error.message));
  }

  return QueryCausalAxiomsOutputSchema.parse({
    axioms: (data ?? []).map((row) => ({
      id: row.id,
      axiom_content: row.axiom_content,
      confidence_score: row.confidence_score ?? 0,
      causal_level: 3 as const,
      source: row.source ?? "session_extracted",
      created_at: row.created_at,
    })),
    total_found: (data ?? []).length,
    query_echo: input.query,
  });
}

export function registerQueryCausalAxioms(server: McpServer, supabase: SupabaseClient): void {
  server.registerTool(
    "query_causal_axioms",
    {
      description: "Search high-confidence causal axioms by keyword and optional domain.",
      inputSchema: QueryCausalAxiomsInputSchema.shape,
      outputSchema: QueryCausalAxiomsOutputSchema.shape,
    },
    async (args) => {
      const structuredContent = await queryCausalAxioms(args, supabase);

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
