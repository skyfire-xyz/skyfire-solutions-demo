import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export const ServerState: Record<
  string,
  | {
      // apiKey: string
      transport: StreamableHTTPServerTransport
      expiresAt: Date
    }
  | undefined
> = {}
