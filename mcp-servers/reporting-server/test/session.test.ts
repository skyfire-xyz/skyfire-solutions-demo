import { test, afterEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'http'
import { AddressInfo } from 'net'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { makeApp } from '../src/app'
import {
  ServerState,
  closeSession,
  reapExpiredSessions,
  registerSession,
  startSessionReaper,
  touchSession
} from '../src/mcp/state'

const sessionCount = (): number => Object.keys(ServerState).length

const listen = async (): Promise<{ server: Server; url: string }> => {
  const app = makeApp()
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      resolve(s)
    })
  })
  const { port } = server.address() as AddressInfo
  return { server, url: `http://127.0.0.1:${port}/mcp` }
}

const connect = async (
  url: string
): Promise<{ client: Client; transport: StreamableHTTPClientTransport }> => {
  const transport = new StreamableHTTPClientTransport(new URL(url))
  const client = new Client({ name: 'test-probe', version: '1.0.0' })
  await client.connect(transport)
  return { client, transport }
}

const expire = (sessionId: string): void => {
  const state = ServerState[sessionId]
  assert.ok(state !== undefined)
  state.expiresAt = new Date(Date.now() - 1000)
}

// the transport's onclose fires asynchronously after a DELETE
const settle = async (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 250))

afterEach(async () => {
  for (const sessionId of Object.keys(ServerState)) {
    await closeSession(sessionId)
  }
})

describe('mcp session lifecycle', () => {
  test('registers a session on initialize', async () => {
    const { server, url } = await listen()
    try {
      const { client, transport } = await connect(url)
      assert.equal(sessionCount(), 1)
      await transport.terminateSession()
      await client.close()
    } finally {
      server.close()
    }
  })

  test('a client that never sends DELETE leaves the session registered', async () => {
    const { server, url } = await listen()
    try {
      const connections = []
      for (let i = 0; i < 5; i++) {
        connections.push(await connect(url))
      }
      assert.equal(sessionCount(), 5)

      // closing only locally is what the pre-fix agent did
      for (const { transport } of connections) {
        await transport.close()
      }
      await settle()
      assert.equal(sessionCount(), 5)
    } finally {
      server.close()
    }
  })

  test('DELETE /mcp releases the session', async () => {
    const { server, url } = await listen()
    try {
      for (let i = 0; i < 5; i++) {
        const { client, transport } = await connect(url)
        await transport.terminateSession()
        await client.close()
      }
      await settle()
      assert.equal(sessionCount(), 0)
    } finally {
      server.close()
    }
  })

  test('DELETE /mcp closes the server transport, not just the entry', async () => {
    const { server, url } = await listen()
    try {
      const { client, transport } = await connect(url)
      const [sessionId] = Object.keys(ServerState)
      const serverTransport = ServerState[sessionId]?.transport
      assert.ok(serverTransport !== undefined)

      let closed = false
      const chained = serverTransport.onclose
      serverTransport.onclose = (): void => {
        closed = true
        chained?.()
      }

      await transport.terminateSession()
      await client.close()
      await settle()

      assert.equal(closed, true)
      assert.equal(sessionCount(), 0)
    } finally {
      server.close()
    }
  })

  test('a transport closing on its own deregisters the session', async () => {
    const { server, url } = await listen()
    try {
      await connect(url)
      const [sessionId] = Object.keys(ServerState)

      await ServerState[sessionId]?.transport.close()
      await settle()

      assert.equal(ServerState[sessionId], undefined)
    } finally {
      server.close()
    }
  })

  test('DELETE for an unknown session is a 404', async () => {
    const { server, url } = await listen()
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'mcp-session-id': '00000000-0000-4000-8000-000000000000' }
      })
      assert.equal(res.status, 404)
    } finally {
      server.close()
    }
  })
})

describe('session reaper', () => {
  test('collects expired sessions and closes their transports', async () => {
    const { server, url } = await listen()
    try {
      for (let i = 0; i < 3; i++) {
        await connect(url)
      }
      assert.equal(sessionCount(), 3)
      Object.keys(ServerState).forEach(expire)

      assert.equal(await reapExpiredSessions(), 3)
      assert.equal(sessionCount(), 0)
    } finally {
      server.close()
    }
  })

  test('leaves unexpired sessions alone', async () => {
    const { server, url } = await listen()
    try {
      await connect(url)
      assert.equal(await reapExpiredSessions(), 0)
      assert.equal(sessionCount(), 1)
    } finally {
      server.close()
    }
  })

  test('touchSession pushes an expired session back out of reach', async () => {
    const { server, url } = await listen()
    try {
      await connect(url)
      const [sessionId] = Object.keys(ServerState)
      expire(sessionId)

      touchSession(sessionId)

      assert.equal(await reapExpiredSessions(), 0)
      assert.equal(sessionCount(), 1)
    } finally {
      server.close()
    }
  })

  test('a request for an existing session refreshes its deadline', async () => {
    const { server, url } = await listen()
    try {
      const { client } = await connect(url)
      const [sessionId] = Object.keys(ServerState)
      expire(sessionId)

      await client.listTools()

      assert.equal(await reapExpiredSessions(), 0)
      assert.equal(sessionCount(), 1)
    } finally {
      server.close()
    }
  })

  test('survives a sweep that rejects', async () => {
    const broken = {
      close: async (): Promise<void> => {
        throw new Error('boom')
      }
    }
    ServerState.poison = {
      transport: broken as unknown as StreamableHTTPServerTransport,
      expiresAt: new Date(Date.now() - 1000)
    }
    // make the sweep itself reject, not just one transport close
    Object.defineProperty(ServerState.poison, 'expiresAt', {
      get: () => {
        throw new Error('expiresAt exploded')
      }
    })

    const reaper = startSessionReaper(20)
    try {
      await new Promise((resolve) => setTimeout(resolve, 150))
      // an unhandled rejection would have torn the process down by now
      assert.ok(true)
    } finally {
      clearInterval(reaper)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete ServerState.poison
    }
  })

  test('sweeps on its interval without holding the event loop open', async () => {
    const { server, url } = await listen()
    try {
      await connect(url)
      Object.keys(ServerState).forEach(expire)

      const reaper = startSessionReaper(20)
      try {
        await new Promise((resolve) => setTimeout(resolve, 200))
        assert.equal(sessionCount(), 0)
      } finally {
        clearInterval(reaper)
      }
    } finally {
      server.close()
    }
  })
})

describe('registerSession', () => {
  test('preserves an onclose handler already on the transport', async () => {
    let sdkHandlerRan = false
    const transport = {
      onclose: (): void => {
        sdkHandlerRan = true
      },
      close: async (): Promise<void> => undefined
    }

    registerSession('chained', transport as never)
    assert.ok(ServerState.chained !== undefined)

    transport.onclose?.()

    // the SDK installs this in server.connect() to tear the MCP server down;
    // replacing it instead of chaining leaves the server dangling
    assert.equal(sdkHandlerRan, true)
    assert.equal(ServerState.chained, undefined)
  })

  test('removes the session even if the chained onclose throws', async () => {
    const transport = {
      onclose: (): void => {
        throw new Error('sdk onclose blew up')
      },
      close: async (): Promise<void> => undefined
    }

    registerSession('throwing', transport as never)
    assert.ok(ServerState.throwing !== undefined)

    // the error still propagates, but the entry must not survive it
    assert.throws(() => {
      transport.onclose?.()
    }, /sdk onclose blew up/)
    assert.equal(ServerState.throwing, undefined)
  })

  test('deregisters the session when the transport closes', async () => {
    const transport = { close: async (): Promise<void> => undefined }
    registerSession('solo', transport as never)
    ;(transport as { onclose?: () => void }).onclose?.()

    assert.equal(ServerState.solo, undefined)
  })
})

describe('closeSession', () => {
  test('returns false for an unknown session', async () => {
    assert.equal(await closeSession('nope'), false)
  })

  test('removes the session even if the transport throws on close', async () => {
    const failing = {
      close: async (): Promise<void> => {
        throw new Error('boom')
      }
    }
    ServerState.broken = {
      transport: failing as unknown as StreamableHTTPServerTransport,
      expiresAt: new Date(Date.now() + 60_000)
    }

    assert.equal(await closeSession('broken'), true)
    assert.equal(ServerState.broken, undefined)
  })
})
