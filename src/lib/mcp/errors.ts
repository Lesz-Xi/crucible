export class McpToolError extends Error {
  constructor(toolName: string, message: string) {
    super(`[${toolName}] ${message}`);
    this.name = "McpToolError";
  }
}
