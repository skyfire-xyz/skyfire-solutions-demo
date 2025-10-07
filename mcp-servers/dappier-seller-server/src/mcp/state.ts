import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

// TODO: use a cache so unused items eventually free their memory
// TODO: store in redis so multiple instances can exist
// TODO: make getter/setters and respected expiresAt field
export const ServerState: Record<
  string,
  | {
      transport: StreamableHTTPServerTransport
      expiresAt: Date
    }
  | undefined
> = {}
