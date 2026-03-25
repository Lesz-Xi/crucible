export const CRUCIBLE_MCP_SERVER_NAME = "crucible-causal-engine";
export const CRUCIBLE_MCP_SERVER_VERSION = "1.0.0";

export const MCP_DOMAINS = [
  "physics",
  "biology",
  "economics",
  "psychology",
  "general",
  "education",
  "legal",
] as const;

export interface McpToolManifestEntry {
  name: string;
  description: string;
}

export const CRUCIBLE_MCP_TOOL_MANIFEST: McpToolManifestEntry[] = [
  {
    name: "query_causal_axioms",
    description: "Search high-confidence causal axioms by keyword and optional domain.",
  },
  {
    name: "get_active_scm",
    description: "Return the active public SCM for a domain or model key.",
  },
  {
    name: "propose_causal_axiom",
    description: "Record a low-confidence agent-proposed causal axiom for later review.",
  },
];
