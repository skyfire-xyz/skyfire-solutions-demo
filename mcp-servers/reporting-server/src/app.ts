import express, { Request, Express, json, text, urlencoded } from 'express'
import { hidePoweredBy, hsts, noSniff } from 'helmet'
import { httpLogger } from './logger'
import { logRequestForAnalytics } from './analytics/usage'
import { config } from './config'
import { deleteSession, handleMcpMessage } from './mcp/session'

const payloadLimit = config.get('payloadLimit.json')

export interface RawBodyRequest extends Request {
  rawBody: string
}

export function makeApp(): Express {
  const app = express()
  app.use(
    json({
      limit: payloadLimit,
      verify: (req, _, buf, encoding) => {
        // save rawBody to req for stripe signature verification
        ;(req as RawBodyRequest).rawBody = buf.toString(
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          (encoding as BufferEncoding) || 'utf8'
        )
      }
    })
  )
  app.use(text())
  app.use(urlencoded({ extended: false }))
  app.use(httpLogger)
  app.use(hsts())
  app.use(noSniff())
  app.use(hidePoweredBy())
  app.use(logRequestForAnalytics)
  app.get('/', (_req, res) => {
    res.send('OK')
  })
  app.post('/mcp', handleMcpMessage)
  app.delete('/mcp', deleteSession)

  return app
}

export const app = makeApp()
