/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import analytics from './track'
// import { getContextStoreUser } from 'src/api/middleware/async-context'

const APIKeyHeader = 'skyfire-api-key'

export function logRequestForAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // only log requests that match the whitelist
  // if (
  //   !config
  //     .get('usageLogging.prefixWhitelist')
  //     .some((prefix) => req.url.startsWith(prefix))
  // ) {
  //   next()
  //   return
  // }

  const startTime = Date.now()
  const requestId = uuidv4()

  const chunks: Buffer[] = []
  const headers = {
    ...req.headers,
    [APIKeyHeader]: 'REDACTED'
  }

  // Capture original methods
  const originalWrite = res.write
  const originalEnd = res.end

  // logo API Request event
  analytics.track({
    event: 'API Request',
    anonymousId: requestId,
    properties: {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      headers,
      payload: req.body,
      queryParams: req.query
    }
  })
  res.write = function (chunk: any, ...args: any[]): boolean {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return originalWrite.apply(res, [chunk, ...args] as any)
  }
  res.end = function (chunk: any, ...args: any[]): Response {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const duration = Date.now() - startTime
    const responseBody = Buffer.concat(chunks).toString('utf8')
    // const user = getContextStoreUser()

    // log API Response event
    analytics.track({
      event: 'API Response',
      anonymousId: requestId,
      properties: {
        // userId: user?.id,
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        headers,
        payload: req.body,
        queryParams: req.query,
        statusCode: res.statusCode,
        responseTime: `${duration}ms`,
        responseBody
      }
    })

    return originalEnd.apply(res, [chunk, ...args] as any)
  } as any

  next()
}
