import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import logger from '../logger'

export const ServerState: Record<
  string,
  | {
      // apiKey: string
      transport: StreamableHTTPServerTransport
      expiresAt: Date
    }
  | undefined
> = {}

export const SESSION_TTL_MS = 60 * 60 * 1000

const REAP_INTERVAL_MS = 5 * 60 * 1000

export function registerSession(
  sessionId: string,
  transport: StreamableHTTPServerTransport
): void {
  ServerState[sessionId] = {
    transport,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  }

  // server.connect() installs its own onclose, so chain rather than replace
  const previousOnClose = transport.onclose
  transport.onclose = (): void => {
    previousOnClose?.()
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete ServerState[sessionId]
  }
}

// push out a session's idle deadline
export function touchSession(sessionId: string): void {
  const state = ServerState[sessionId]
  if (state !== undefined) {
    state.expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  }
}

// each entry pins a transport and the MCP server connected to it, so dropping
// the entry without closing the transport leaks both
export async function closeSession(sessionId: string): Promise<boolean> {
  const state = ServerState[sessionId]
  if (state === undefined) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete ServerState[sessionId]
  try {
    await state.transport.close()
  } catch (error) {
    logger.error(error, `failed to close transport for session ${sessionId}`)
  }
  return true
}

export async function reapExpiredSessions(): Promise<number> {
  const now = Date.now()
  const expired = Object.entries(ServerState)
    .filter(
      ([, state]) => state !== undefined && state.expiresAt.getTime() <= now
    )
    .map(([sessionId]) => sessionId)

  for (const sessionId of expired) {
    await closeSession(sessionId)
  }
  if (expired.length > 0) {
    logger.info(
      { reaped: expired.length, remaining: Object.keys(ServerState).length },
      'reaped expired mcp sessions'
    )
  }
  return expired.length
}

// clients aren't required to send DELETE /mcp, so a periodic sweep is the only
// thing bounding session state
export function startSessionReaper(
  intervalMs: number = REAP_INTERVAL_MS
): NodeJS.Timeout {
  const timer = setInterval(() => {
    void reapExpiredSessions()
  }, intervalMs)
  timer.unref()
  return timer
}
