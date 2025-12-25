import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export { McpError };

export function asMcpError(error: unknown): McpError {
  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}
