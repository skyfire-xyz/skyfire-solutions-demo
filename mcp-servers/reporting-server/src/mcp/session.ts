import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { v4, validate as validateUUID } from 'uuid'
import { Request, Response } from 'express'
import logger from '../logger'
import { config } from '../config'
import { ServerState } from './state'
import { ReportingMCP } from './mcp'

// handle when a client initializes a connection
export async function handleMcpMessage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    await handleMcpMessageUnsafe(req, res)
  } catch (error) {
    logger.error(error, 'failed to handle mcp message without an error')
    res.status(500).json({
      error: 'Server Error'
    })
  }
}

// For now lets assume the resource metadata is at the api host
const RESOURCE_METADATA_URL = config.get('apiHost')

export async function handleMcpMessageUnsafe(
  req: Request,
  res: Response
): Promise<void> {
  // check if this is an initial connection request
  const isInitRequest = req.body && req.body.method === 'initialize'
  logger.info({ req, body: req.body }, 'debug handle mcp message')

  if (isInitRequest) {
    // for new sessions, generate a unique ID
    const sessionId = v4()

    // create a transport for this session, disable transport's own sessionId management,
    // since we store a separate transport for each session
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    })
    const mcpServer = new ReportingMCP()
    transport.sessionId = sessionId
    await mcpServer.server.connect(transport)
    ServerState[sessionId] = {
      // apiKey,
      transport,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }

    // tell LLM application the session ID
    res.setHeader('Mcp-Session-Id', sessionId)

    // handle the initialize request
    await transport.handleRequest(req, res, req.body)
  } else {
    // for existing sessions, get the ID from the header
    const sessionId = req.headers['mcp-session-id']
    if (sessionId === undefined) {
        res
          .status(401)
          .header(
            'www-authenticate',
            `resource_metadata=${RESOURCE_METADATA_URL}/.well-known/oauth-protected-resource`
          )
        return
    }
    if (typeof sessionId !== 'string') {
      res.status(400).json({
        error: 'invalid session id'
      })
      return
    }
    if (!validateUUID(sessionId)) {
      res.status(400).json({
        error: 'invalid session id format'
      })
      return
    }

    // look up the transport for this session
    const serverState = ServerState[sessionId]
    if (serverState === undefined) {
      res.status(404).json({
        error: 'Session not found'
      })
      return
    }
    const { transport } = serverState

    // handle the request using the existing transport
    await transport.handleRequest(req, res, req.body)
  }
}

// don't forget cleanup when sessions end
export async function deleteSession(
  req: Request,
  res: Response
): Promise<void> {
  const sessionId = req.headers['mcp-session-id']
  if (typeof sessionId !== 'string') {
    res.status(400).json({
      error: 'invalid session id'
    })
    return
  }
  if (!validateUUID(sessionId)) {
    res.status(400).json({
      error: 'invalid session id format'
    })
    return
  }

  if (ServerState[sessionId]) {
    // Clean up the session
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete ServerState[sessionId]
    res.status(204).end()
  } else {
    res.status(404).json({ error: 'Session not found' })
  }
}
