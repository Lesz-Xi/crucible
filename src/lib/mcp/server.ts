import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CRUCIBLE_MCP_SERVER_NAME,
  CRUCIBLE_MCP_SERVER_VERSION,
  CRUCIBLE_MCP_TOOL_MANIFEST,
} from "@/lib/mcp/types";
import { registerGetActiveScm } from "@/lib/mcp/tools/get-active-scm";
import { registerProposeCausalAxiom } from "@/lib/mcp/tools/propose-causal-axiom";
import { registerQueryCausalAxioms } from "@/lib/mcp/tools/query-causal-axioms";

export function createCrucibleMcpServer(supabase: SupabaseClient): McpServer {
  const server = new McpServer({
    name: CRUCIBLE_MCP_SERVER_NAME,
    version: CRUCIBLE_MCP_SERVER_VERSION,
  });

  registerQueryCausalAxioms(server, supabase);
  registerGetActiveScm(server, supabase);
  registerProposeCausalAxiom(server, supabase);

  return server;
}

export function getCrucibleMcpManifest(): Record<string, unknown> {
  return {
    name: CRUCIBLE_MCP_SERVER_NAME,
    version: CRUCIBLE_MCP_SERVER_VERSION,
    transport: "streamable-http",
    tools: CRUCIBLE_MCP_TOOL_MANIFEST,
  };
}
