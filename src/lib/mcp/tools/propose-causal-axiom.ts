import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { McpToolError } from "@/lib/mcp/errors";
import { MCP_DOMAINS } from "@/lib/mcp/types";

const PROPOSAL_CONFIDENCE = 0.1;
const PROPOSAL_SOURCE = "agent_proposed";
const PROPOSAL_STATUS = "pending_review";

const ProposeCausalAxiomInputSchema = z.object({
  axiom_content: z.string().min(20).max(1000),
  domain: z.enum(MCP_DOMAINS).default("general"),
  justification: z.string().min(30).max(2000),
  session_id: z.string().uuid().optional(),
  agent_id: z.string().min(1).max(200),
});

const ProposeCausalAxiomOutputSchema = z.object({
  success: z.literal(true),
  axiom_id: z.string().uuid(),
  status: z.literal(PROPOSAL_STATUS),
  confidence_score: z.literal(PROPOSAL_CONFIDENCE),
  message: z.string(),
});

export type ProposeCausalAxiomInput = z.infer<typeof ProposeCausalAxiomInputSchema>;
export type ProposeCausalAxiomOutput = z.infer<typeof ProposeCausalAxiomOutputSchema>;

function sanitizeProposalError(message: string): string {
  return /policy|permission|rls|not authorized/i.test(message) ? "Access denied by policy" : message;
}

export async function proposeCausalAxiom(
  input: ProposeCausalAxiomInput,
  supabase: SupabaseClient
): Promise<ProposeCausalAxiomOutput> {
  const { data, error } = await supabase
    .from("causal_axioms")
    .insert({
      axiom_content: input.axiom_content,
      confidence_score: PROPOSAL_CONFIDENCE,
      source: PROPOSAL_SOURCE,
      review_status: PROPOSAL_STATUS,
      agent_id: input.agent_id,
      justification: input.justification,
      domain: input.domain ?? "general",
      session_id: input.session_id ?? null,
      derived_from_messages: [],
    })
    .select("id")
    .single();

  if (error) {
    throw new McpToolError("propose_causal_axiom", sanitizeProposalError(error.message));
  }

  return ProposeCausalAxiomOutputSchema.parse({
    success: true,
    axiom_id: data.id,
    status: PROPOSAL_STATUS,
    confidence_score: PROPOSAL_CONFIDENCE,
    message: `Axiom proposal recorded with id ${data.id}. Status: pending_review. Confidence will remain at 0.1 until verified by a human or the DisagreementEngine.`,
  });
}

export function registerProposeCausalAxiom(server: McpServer, supabase: SupabaseClient): void {
  server.registerTool(
    "propose_causal_axiom",
    {
      description: "Record a low-confidence agent-proposed causal axiom for later review.",
      inputSchema: ProposeCausalAxiomInputSchema.shape,
      outputSchema: ProposeCausalAxiomOutputSchema.shape,
    },
    async (args) => {
      const structuredContent = await proposeCausalAxiom(args, supabase);

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
