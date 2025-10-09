import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export const ServerState: Record<
  string,
  | {
      transport: StreamableHTTPServerTransport
      expiresAt: Date
    }
  | undefined
> = {}
